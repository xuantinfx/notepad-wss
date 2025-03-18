import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDocumentSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { WebSocketServer, WebSocket } from "ws";

// Tracking connected clients by document ID
interface ClientConnection {
  documentId: number;
  socket: WebSocket;
}

// Type for WebSocket messages
type WSMessage = {
  type: 'update' | 'sync' | 'join' | 'user_info';
  documentId: number;
  content?: string;
  filename?: string;
  userId?: string;
  username?: string;
  cursor?: { line: number; column: number };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Store active connections
  const clients: ClientConnection[] = [];
  
  // Get all documents
  app.get("/api/documents", async (req: Request, res: Response) => {
    try {
      const documents = await storage.listDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve documents" });
    }
  });

  // Get document by ID
  app.get("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve document" });
    }
  });

  // Create new document
  app.post("/api/documents", async (req: Request, res: Response) => {
    try {
      const parseResult = insertDocumentSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        const errorMessage = fromZodError(parseResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const document = await storage.createDocument(parseResult.data);
      res.status(201).json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  // Update document
  app.put("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const parseResult = insertDocumentSchema.partial().safeParse(req.body);
      
      if (!parseResult.success) {
        const errorMessage = fromZodError(parseResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const updatedDocument = await storage.updateDocument(id, parseResult.data);
      
      if (!updatedDocument) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Broadcast update to all clients editing this document
      broadcastDocumentUpdate(id, updatedDocument.content, updatedDocument.filename);
      
      res.json(updatedDocument);
    } catch (error) {
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDocument(id);
      
      if (!success) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (socket: WebSocket) => {
    console.log('New WebSocket connection established');
    
    socket.on('message', async (message: string) => {
      try {
        const data: WSMessage = JSON.parse(message);
        
        switch(data.type) {
          case 'join':
            // User joins a document editing session
            if (data.documentId) {
              // Add to client list
              clients.push({
                documentId: data.documentId,
                socket
              });
              
              // Get the latest version of the document
              const document = await storage.getDocument(data.documentId);
              if (document) {
                // Send the current document state to the new user
                socket.send(JSON.stringify({
                  type: 'sync',
                  documentId: data.documentId,
                  content: document.content,
                  filename: document.filename
                }));
                
                // Notify other users about the new joiner
                if (data.userId && data.username) {
                  broadcastToDocumentUsers(data.documentId, {
                    type: 'user_info',
                    documentId: data.documentId,
                    userId: data.userId,
                    username: data.username,
                  }, socket);
                }
              }
            }
            break;
            
          case 'update':
            // Real-time update from a user
            if (data.documentId && data.content !== undefined) {
              // Update the document in storage
              await storage.updateDocument(data.documentId, {
                content: data.content,
                lastModified: new Date().toISOString()
              });
              
              // Broadcast to all other users editing this document
              broadcastToDocumentUsers(data.documentId, {
                type: 'update',
                documentId: data.documentId,
                content: data.content,
                cursor: data.cursor
              }, socket);
            }
            break;
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    });
    
    socket.on('close', () => {
      // Remove from clients list
      const index = clients.findIndex(client => client.socket === socket);
      if (index !== -1) {
        clients.splice(index, 1);
      }
    });
  });
  
  // Function to broadcast document updates to all clients editing a specific document
  function broadcastDocumentUpdate(documentId: number, content: string, filename: string) {
    const documentClients = clients.filter(client => client.documentId === documentId);
    
    documentClients.forEach(client => {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(JSON.stringify({
          type: 'update',
          documentId,
          content,
          filename
        }));
      }
    });
  }
  
  // Function to broadcast message to all users of a document except the sender
  function broadcastToDocumentUsers(documentId: number, message: WSMessage, senderSocket?: WebSocket) {
    const documentClients = clients.filter(client => 
      client.documentId === documentId && (!senderSocket || client.socket !== senderSocket)
    );
    
    documentClients.forEach(client => {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(JSON.stringify(message));
      }
    });
  }
  
  return httpServer;
}
