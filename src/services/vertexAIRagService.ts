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

class VertexAIRagService {
  private config: RagCorpusConfig;
  private client: AxiosInstance | null = null;
  private initialized: boolean = false;
  private environment: 'local' | 'cloud-run' = 'local';
  
  // In-memory cache for Q&A mappings (fileId -> {question, answer})
  private qaCache: Map<string, { question: string; answer: string }> = new Map();

  constructor() {
    this.config = {
      projectId: process.env.PROJECT_ID || '',
      location: process.env.LOCATION || 'us-west1',
      corpusName: process.env.CORPUS_NAME || '',
      corpusId: '',
      // Note: RAG features are primarily in v1beta1
      endpoint: process.env.ENDPOINT_URL || `https://${process.env.LOCATION || 'us-west1'}-aiplatform.googleapis.com/v1beta1`,
    };

    this.environment = this.detectEnvironment();
  }

  private detectEnvironment(): 'local' | 'cloud-run' {
    const isCloudRun = !!process.env.K_SERVICE;
    return isCloudRun ? 'cloud-run' : 'local';
  }

  private async getAccessToken(): Promise<string> {
    try {
      const { GoogleAuth } = require('google-auth-library');

      const authConfig: any = {
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      };

      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (fs.existsSync(credPath)) {
          authConfig.keyFilename = credPath;
        }
      }

      const auth = new GoogleAuth(authConfig);
      const client = await auth.getClient();
      const accessToken = await client.getAccessToken();

      if (!accessToken.token) {
        throw new Error('Failed to obtain access token');
      }

      return accessToken.token;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to authenticate with GCP: ${msg}`);
    }
  }

  async initialize(): Promise<void> {
    try {
      if (!this.config.projectId || !this.config.corpusName) {
        throw new Error('Missing PROJECT_ID or CORPUS_NAME in environment');
      }

      const accessToken = await this.getAccessToken();

      this.client = axios.create({
        baseURL: this.config.endpoint,
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
      const msg = error instanceof Error ? error.message : String(error);
      console.error('FATAL: RAG initialization failed:', msg);
      throw error;
    }
  }

  private async resolveCorporus(): Promise<void> {
    if (!this.client) throw new Error('Client not initialized');

    try {
      if (process.env.RESOURCE_NAME) {
        const resourceName = process.env.RESOURCE_NAME;
        this.config.corpusId = resourceName.split('/').pop() || '';
        return;
      }

      const parent = `projects/${this.config.projectId}/locations/${this.config.location}`;
      // FIXED: Use ragCorpora (plural)
      const response = await this.client.get(`${parent}/ragCorpora`);

      const corpora = response.data.ragCorpora || [];
      const corpus = corpora.find((c: any) => c.displayName === this.config.corpusName);

      if (!corpus) {
        throw new Error(`Corpus "${this.config.corpusName}" not found.`);
      }

      this.config.corpusId = corpus.name.split('/').pop() || '';
    } catch (error) {
      throw error;
    }
  }

  async uploadFile(
    filePath: string,
    displayName?: string,
    description?: string
  ): Promise<RagFile> {
    if (!this.initialized || !this.client || !this.config.corpusId) {
      throw new Error('RAG service not initialized');
    }

    try {
      const fileContent = fs.readFileSync(filePath);
      const base64Content = fileContent.toString('base64');

      const requestBody = {
        ragFile: {
          displayName: displayName || path.basename(filePath),
          description: description || '',
          directUploadSource: {
            content: base64Content,
          },
        },
      };

      // FIXED: Use ragCorpora
      const uploadEndpoint = `/projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora/${this.config.corpusId}/ragFiles:upload`;
      
      const uploadClient = axios.create({
        // Vertex AI requires /upload prefix for media/file uploads
        baseURL: `https://${this.config.location}-aiplatform.googleapis.com/upload/v1beta1`,
        headers: {
          'Authorization': (this.client.defaults.headers as any).Authorization,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      });

      const response = await uploadClient.post(uploadEndpoint, requestBody);

      // Get the file ID
      const fileId = response.data.name?.split('/').pop() || uuidv4();
      
      // Store Q&A in cache
      this.qaCache.set(fileId, {
        question: displayName || 'Untitled',
        answer: description || 'No description'
      });
      
      console.log(`✅ Cached Q&A for file ${fileId}:`, { question: displayName, answer: description });

      return {
        id: fileId,
        name: response.data.name || '',
        displayName: displayName || 'Untitled',
        description: description || '',
        type: this.getFileType(filePath),
        createdAt: response.data.createTime || new Date().toISOString(),
        updatedAt: response.data.updateTime || new Date().toISOString(),
        status: response.data.processingState || 'COMPLETED',
      };
    } catch (error: any) {
      console.error(`Upload failed: ${error.response?.data?.error?.message || error.message}`);
      throw error;
    }
  }

  async listFiles(pageSize: number = 100): Promise<RagFile[]> {
    if (!this.initialized || !this.client || !this.config.corpusId) {
      throw new Error('RAG service not initialized');
    }

    try {
      // FIXED: Use ragCorpora
      const endpoint = `/projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora/${this.config.corpusId}/ragFiles`;
      
      const response = await this.client.get(endpoint, {
        params: { pageSize }
      });

      const files = response.data.ragFiles || [];

      // DEBUG: Log the first file to see what fields are available
      if (files.length > 0) {
        console.log('📋 Sample RAG file from API:', JSON.stringify(files[0], null, 2));
      }

      return files.map((file: any) => {
        const fileId = file.name?.split('/').pop() || '';
        
        // Try to get Q&A from cache first
        const cached = this.qaCache.get(fileId);
        
        return {
          id: fileId,
          name: file.name || '',
          displayName: cached?.question || file.displayName || 'Untitled File',
          description: cached?.answer || file.description || 'No description',
          type: this.getFileType(file.name || ''),
          createdAt: file.createTime || new Date().toISOString(),
          updatedAt: file.updateTime || new Date().toISOString(),
          status: file.fileStatus?.state === 'ACTIVE' ? 'COMPLETED' : 'PROCESSING',
        };
      });
    } catch (error: any) {
      console.error(`List files failed: ${error.response?.data?.error?.message || error.message}`);
      return [];
    }
  }

  async deleteFile(fileId: string): Promise<boolean> {
    if (!this.initialized || !this.client || !this.config.corpusId) {
      throw new Error('RAG service not initialized');
    }

    try {
      // FIXED: Use ragCorpora
      const resourcePath = `projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora/${this.config.corpusId}/ragFiles/${fileId}`;
      await this.client.delete(`/${resourcePath}`);
      return true;
    } catch (error: any) {
      console.error(`Delete failed: ${error.response?.data?.error?.message || error.message}`);
      throw error;
    }
  }

  async retrieveContexts(query: string, topK: number = 5): Promise<any[]> {
    if (!this.initialized || !this.client || !this.config.corpusId) {
      throw new Error('RAG service not initialized');
    }

    try {
      // FIXED: Use ragCorpora
      const ragCorpus = `projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora/${this.config.corpusId}`;
      const requestBody = {
        query: query,
        retrievalConfig: { topKDocuments: topK },
      };

      const response = await this.client.post(`${ragCorpus}:retrieveContexts`, requestBody);
      return response.data.contexts || [];
    } catch (error: any) {
      console.error(`Retrieval failed: ${error.response?.data?.error?.message || error.message}`);
      throw error;
    }
  }

  async getStats(): Promise<{
    totalFiles: number;
    byType: { manual: number; csv: number; pdf: number; docx: number };
  }> {
    try {
      const files = await this.listFiles();

      return {
        totalFiles: files.length,
        byType: {
          manual: files.filter((f) => f.type === 'manual').length,
          csv: files.filter((f) => f.type === 'csv').length,
          pdf: files.filter((f) => f.type === 'pdf').length,
          docx: files.filter((f) => f.type === 'docx').length,
        },
      };
    } catch (error) {
      console.error('Failed to get stats:', error);
      throw error;
    }
  }

  // FIXED: Added safety check to ensure filename is a string
  private getFileType(filename: any): 'manual' | 'csv' | 'pdf' | 'docx' {
    if (!filename || typeof filename !== 'string') {
        return 'manual';
    }
    
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.csv') return 'csv';
    if (ext === '.docx' || ext === '.doc') return 'docx';
    if (ext === '.pdf') return 'pdf';
    return 'manual';
  }

  isInitialized(): boolean {
    return this.initialized && !!this.client;
  }

  getConfig() {
    return {
      projectId: this.config.projectId,
      location: this.config.location,
      corpusName: this.config.corpusName,
      corpusId: this.config.corpusId,
    };
  }
}

export const vertexAIRag = new VertexAIRagService();
export default vertexAIRag;