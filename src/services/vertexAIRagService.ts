import axios, { AxiosInstance } from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface RagFile {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  type: 'manual' | 'csv' | 'pdf' | 'docx';
  createdAt: string;
  updatedAt: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

interface RagCorpusConfig {
  projectId: string;
  location: string;
  corpusName: string;
  corpusId: string;
  endpoint: string;
}

// Simple Cache Interface for LangGraph-like behavior
interface CacheEntry {
  answer: string;
  timestamp: number;
}

class VertexAIRagService {
  private config: RagCorpusConfig;
  private client: AxiosInstance | null = null;
  private initialized: boolean = false;
  private environment: 'local' | 'cloud-run' = 'local';
  
  // In-memory cache for Q&A mappings (fileId -> {question, answer})
  private qaCache: Map<string, { question: string; answer: string }> = new Map();

  // Semantic Cache for Answered Questions (Question -> Answer)
  // In a full LangGraph setup, this would be a persistent vector store, 
  // but we implement it here as an intelligent memory layer.
  private answerCache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 1000 * 60 * 60; // 1 hour

  constructor() {
    const loc = process.env.LOCATION || 'us-west1';
    this.config = {
      projectId: process.env.PROJECT_ID || '',
      location: loc,
      corpusName: process.env.CORPUS_NAME || '',
      corpusId: '',
      endpoint: process.env.ENDPOINT_URL || `https://${loc}-aiplatform.googleapis.com/v1beta1`,
    };

    this.environment = this.detectEnvironment();
  }

  private detectEnvironment(): 'local' | 'cloud-run' {
    return !!process.env.K_SERVICE ? 'cloud-run' : 'local';
  }

  private async getAccessToken(): Promise<string> {
    try {
      const { GoogleAuth } = require('google-auth-library');
      const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
      const client = await auth.getClient();
      const accessToken = await client.getAccessToken();
      if (!accessToken.token) throw new Error('Failed to obtain access token');
      return accessToken.token;
    } catch (error) {
      throw new Error(`Auth failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async initialize(): Promise<void> {
    try {
      if (!this.config.projectId || (!this.config.corpusName && !process.env.RESOURCE_NAME)) {
        throw new Error('Missing PROJECT_ID or CORPUS_NAME');
      }

      const accessToken = await this.getAccessToken();
      this.client = axios.create({
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      await this.resolveCorporus();
      this.initialized = true;
      console.log('✅ Vertex AI RAG Service initialized');
    } catch (error) {
      console.error('FATAL: RAG initialization failed:', error);
      throw error;
    }
  }

  private async resolveCorporus(): Promise<void> {
    if (process.env.RESOURCE_NAME) {
      const parts = process.env.RESOURCE_NAME.split('/');
      const idx = parts.indexOf('ragCorpora');
      this.config.corpusId = (idx !== -1 && parts[idx+1]) ? parts[idx+1] : parts.pop() || '';
      console.log(`Using Corpus ID from RESOURCE_NAME: ${this.config.corpusId}`);
      return;
    }

    if (!this.client) return;
    const url = `${this.config.endpoint}/projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora`;
    const response = await this.client.get(url);
    // FIXED: Changed this.config.displayName to this.config.corpusName to fix TS2339 error
    const corpus = (response.data.ragCorpora || []).find((c: any) => c.displayName === this.config.corpusName);
    if (!corpus) throw new Error(`Corpus ${this.config.corpusName} not found`);
    this.config.corpusId = corpus.name.split('/').pop() || '';
  }

  async uploadFile(filePath: string, displayName?: string, description?: string): Promise<RagFile> {
    if (!this.initialized || !this.client) throw new Error('Not initialized');
    const content = fs.readFileSync(filePath).toString('base64');
    
    const uploadUrl = `https://${this.config.location}-aiplatform.googleapis.com/upload/v1beta1/projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora/${this.config.corpusId}/ragFiles:upload`;
    
    const response = await axios.post(uploadUrl, {
      ragFile: { 
        displayName: displayName || path.basename(filePath), 
        description, 
        directUploadSource: { content } 
      }
    }, {
      headers: { 'Authorization': this.client.defaults.headers['Authorization'], 'Content-Type': 'application/json' }
    });

    const fileId = response.data.name?.split('/').pop() || uuidv4();
    this.qaCache.set(fileId, { question: displayName || 'Untitled', answer: description || '' });
    
    return {
      id: fileId,
      name: response.data.name,
      displayName: displayName || 'Untitled',
      description: description || '',
      type: this.getFileType(filePath),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'COMPLETED'
    };
  }

  /**
   * Retrieve answer using Gemini with RAG tool
   * 1. Checks semantic cache first (LangGraph-style caching)
   * 2. If no info found, asks for user email
   */
  async retrieveContextsWithRAG(query: string, topK: number = 3): Promise<string> {
    if (!this.initialized || !this.client) {
      console.error('[RAG] Service not initialized');
      return 'I cannot answer right now. Please try again later.';
    }

    // --- STEP 1: SEMANTIC CACHE CHECK (LangGraph Functionality) ---
    const normalizedQuery = query.toLowerCase().trim();
    const cached = this.answerCache.get(normalizedQuery);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
      console.log(`[RAG] 🚀 Cache Hit for: "${query}"`);
      return cached.answer;
    }

    try {
      const corpusResource = `projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora/${this.config.corpusId}`;
      const geminiUrl = `https://${this.config.location}-aiplatform.googleapis.com/v1beta1/projects/${this.config.projectId}/locations/${this.config.location}/publishers/google/models/gemini-2.5-flash:generateContent`;
      
      const requestBody = {
        contents: [{ role: 'user', parts: [{ text: query }] }],
        tools: [{
          retrieval: {
            vertexRagStore: {
              ragResources: [{ ragCorpus: corpusResource }],
              similarityTopK: topK
            }
          }
        }],
        systemInstruction: {
          parts: [{
            text: "You are a helpful assistant. Use the provided context to answer. If you cannot find the answer in the context, clearly state that you don't have that information."
          }]
        }
      };

      const response = await this.client.post(geminiUrl, requestBody);
      let answer = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // --- STEP 2: NO INFORMATION -> EMAIL REQUEST ---
      const negativePatterns = [
        "don't have that information", 
        "no information", 
        "cannot find", 
        "not mentioned in the context",
        "i'm sorry, but i don't know"
      ];

      const isNegative = negativePatterns.some(p => answer.toLowerCase().includes(p)) || answer.length < 5;

      if (isNegative) {
        answer = "I'm sorry, I couldn't find specific information regarding that in our knowledge base. Would you mind providing your email address? I'll have one of our team members look into this and get back to you personally.";
      } else {
        // Cache the successful answer (STEP 3: Update Semantic Cache)
        this.answerCache.set(normalizedQuery, {
          answer: answer,
          timestamp: Date.now()
        });
      }
      
      return answer;
    } catch (error: any) {
      console.error(`[RAG] Retrieval failed: ${error.response?.data?.error?.message || error.message}`);
      return "I encountered an error searching our records. Please leave your email address and your question, and we'll reply to you directly.";
    }
  }

  /**
   * Legacy method - kept for backwards compatibility
   */
  async retrieveContexts(query: string, topK: number = 5): Promise<any[]> {
    const answer = await this.retrieveContextsWithRAG(query, topK);
    return [{ text: answer }];
  }

  async listFiles(pageSize: number = 100): Promise<RagFile[]> {
    if (!this.initialized || !this.client) return [];
    try {
      const url = `${this.config.endpoint}/projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora/${this.config.corpusId}/ragFiles`;
      const response = await this.client.get(url, { params: { pageSize } });
      
      return (response.data.ragFiles || []).map((file: any) => {
        const fileId = file.name?.split('/').pop() || '';
        const cached = this.qaCache.get(fileId);
        return {
          id: fileId,
          name: file.name,
          displayName: cached?.question || file.displayName || 'Untitled',
          description: cached?.answer || file.description || '',
          type: this.getFileType(file.name),
          createdAt: file.createTime,
          updatedAt: file.updateTime,
          status: file.fileStatus?.state === 'ACTIVE' ? 'COMPLETED' : 'PROCESSING'
        };
      });
    } catch (e) { return []; }
  }

  async getStats() {
    const files = await this.listFiles();
    return {
      totalFiles: files.length,
      byType: {
        manual: files.filter(f => f.type === 'manual').length,
        csv: files.filter(f => f.type === 'csv').length,
        pdf: files.filter(f => f.type === 'pdf').length,
        docx: files.filter(f => f.type === 'docx').length
      }
    };
  }

  async deleteFile(fileId: string): Promise<boolean> {
    if (!this.client) return false;
    const url = `${this.config.endpoint}/projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora/${this.config.corpusId}/ragFiles/${fileId}`;
    await this.client.delete(url);
    // Clear answer cache when knowledge changes
    this.answerCache.clear();
    return true;
  }

  private getFileType(filename: any): 'manual' | 'csv' | 'pdf' | 'docx' {
    if (typeof filename !== 'string') return 'manual';
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.csv') return 'csv';
    if (ext === '.docx' || ext === '.doc') return 'docx';
    if (ext === '.pdf') return 'pdf';
    return 'manual';
  }

  isInitialized(): boolean { return this.initialized; }
  getConfig() { return { ...this.config }; }
}

export const vertexAIRag = new VertexAIRagService();
export default vertexAIRag;