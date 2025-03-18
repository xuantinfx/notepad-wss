import { documents, type Document, type InsertDocument } from "@shared/schema";

export interface IStorage {
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentByFilename(filename: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  listDocuments(): Promise<Document[]>;
}

export class MemStorage implements IStorage {
  private documents: Map<number, Document>;
  currentId: number;

  constructor() {
    this.documents = new Map();
    this.currentId = 1;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentByFilename(filename: string): Promise<Document | undefined> {
    return Array.from(this.documents.values()).find(
      (doc) => doc.filename === filename,
    );
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentId++;
    const document: Document = { ...insertDocument, id };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined> {
    const existingDocument = this.documents.get(id);
    if (!existingDocument) {
      return undefined;
    }

    const updatedDocument = { ...existingDocument, ...document };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  async listDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }
}

export const storage = new MemStorage();
