/**
 * Knowledge Base Controller (Production)
 * 
 * ✅ Vertex AI RAG stores document content for semantic search
 * ✅ Firebase Firestore stores Q&A metadata for fast retrieval
 * ✅ Cloud Run compatible
 * ✅ Background processing for RAG operations (async queuing)
 */

import { type Request, type Response } from 'express';
import fs from 'fs';
import mammoth from 'mammoth';
import path from 'path';
import backgroundTaskService from '../services/backgroundTaskService';
import firebaseService from '../services/firebaseService';
import vertexAIRag from '../services/vertexAIRagService';

// Temporary file directory for uploads
const RAG_TEMP_DIR = path.join(process.cwd(), '.rag-temp');

/**
 * Helper to chunk text into manageable segments
 */
function chunkText(text: string, maxChunkSize: number = 4000): string[] {
  if (!text) return [];

  const chunks: string[] = [];
  let currentChunk = "";

  // Split by paragraphs first to avoid breaking sentences/paragraphs if possible
  const sections = text.split(/\n\s*\n/);

  for (const section of sections) {
    if ((currentChunk.length + section.length) > maxChunkSize) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }

      // If a single section is larger than maxChunkSize, split it by sentences or characters
      if (section.length > maxChunkSize) {
        let remaining = section;
        while (remaining.length > maxChunkSize) {
          chunks.push(remaining.substring(0, maxChunkSize).trim());
          remaining = remaining.substring(maxChunkSize);
        }
        currentChunk = remaining;
      } else {
        currentChunk = section;
      }
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + section;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Ensure temp directory exists
 */
function ensureTempDir() {
  if (!fs.existsSync(RAG_TEMP_DIR)) {
    fs.mkdirSync(RAG_TEMP_DIR, { recursive: true });
  }
}

/**
 * Helper to map Vertex AI file properties to UI KnowledgeItem properties
 * This ensures the frontend always receives 'question' and 'answer' keys.
 */
const mapFileToUI = (file: any) => ({
  id: file.id,
  // Map Vertex AI 'displayName' to UI 'question'
  question: file.displayName || 'Unnamed Document',
  // Map Vertex AI 'description' to UI 'answer'
  answer: file.description || 'No content description available.',
  type: file.type || 'manual',
  status: file.status,
  createdAt: file.createdAt,
  updatedAt: file.updatedAt,
});

/**
 * GET /api/knowledge
 * List all knowledge items from Firebase Firestore
 */
export const getAllKnowledge = async (req: Request, res: Response): Promise<void> => {
  try {
    const knowledgeItems = await firebaseService.getAllKnowledge();

    (res as any).json({
      success: true,
      data: knowledgeItems,
      total: knowledgeItems.length,
    });
  } catch (error: any) {
    console.error('❌ Get all knowledge error:', error.message);
    // Return empty list on error instead of 500 - allows UI to function
    (res as any).json({
      success: true,
      data: [],
      total: 0,
      error: 'Failed to fetch from Firestore (collection may not exist yet)',
      message: error.message,
    });
  }
};

/**
 * GET /api/knowledge/stats
 */
export const getKnowledgeStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await firebaseService.getDetailedStats();
    (res as any).json({ success: true, data: stats });
  } catch (error: any) {
    (res as any).status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/knowledge/:id
 */
export const getKnowledgeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      (res as any).status(400).json({ success: false, error: 'ID is required' });
      return;
    }

    const item = await firebaseService.getKnowledgeById(id as string);

    if (!item) {
      (res as any).status(404).json({ success: false, error: 'Knowledge item not found' });
      return;
    }

    (res as any).json({
      success: true,
      data: item
    });
  } catch (error: any) {
    (res as any).status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/knowledge
 * Creates Q&A: Queues for async upload to Vertex AI RAG + Saves to Firebase
 */
export const createKnowledge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      (res as any).status(400).json({ success: false, error: 'Question and answer are required' });
      return;
    }

    // 1. Save metadata to Firebase with PROCESSING status
    const knowledgeData = await firebaseService.saveKnowledge({
      ragFileId: '', // Will be populated by background task
      question: question.trim(),
      answer: answer.trim(),
      type: 'manual',
      status: 'PROCESSING', // Mark as processing initially
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2. Queue RAG upload in background
    ensureTempDir();
    const tempFile = path.join(RAG_TEMP_DIR, `upload_${Date.now()}_${knowledgeData.id}.txt`);
    fs.writeFileSync(tempFile, `Q: ${question.trim()}\n\nA: ${answer.trim()}`);

    backgroundTaskService.queueTask('UPLOAD_RAG', knowledgeData.id, {
      tempFilePath: tempFile,
      displayName: question.substring(0, 100),
      description: answer.substring(0, 500),
    });

    // Return immediately without waiting for RAG upload
    (res as any).status(201).json({
      success: true,
      message: 'Knowledge item queued for processing',
      data: {
        ...knowledgeData,
        status: 'PROCESSING',
      },
    });
  } catch (error: any) {
    console.error('❌ Create knowledge error:', error.message);
    (res as any).status(500).json({ success: false, error: error.message });
  }
};

/**
 * PUT /api/knowledge/:id
 * Updates Q&A: Queues for async delete (old RAG file) + upload (new RAG file)
 */
export const updateKnowledge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { question, answer } = req.body;

    if (!id || !question || !answer) {
      (res as any).status(400).json({ success: false, error: 'Required fields missing' });
      return;
    }

    // Get the knowledge metadata to find the old RAG file ID
    let knowledge = null;
    try {
      knowledge = await firebaseService.getKnowledgeById(id);
      console.log(`📚 Found knowledge item: ${id}, ragFileId: ${knowledge?.ragFileId}`);
    } catch (e) {
      console.warn('⚠️  Could not fetch from Firebase, proceeding with update');
    }

    if (!knowledge) {
      (res as any).status(404).json({ success: false, error: 'Knowledge item not found' });
      return;
    }

    // Update Firebase immediately with new content and PROCESSING status
    await firebaseService.updateKnowledge(id, {
      question: question.trim(),
      answer: answer.trim(),
      status: 'PROCESSING', // Mark as processing
      updatedAt: new Date().toISOString(),
    });

    // Queue RAG update (delete old + upload new) in background
    ensureTempDir();
    const tempFile = path.join(RAG_TEMP_DIR, `update_${Date.now()}_${id}.txt`);
    fs.writeFileSync(tempFile, `Q: ${question.trim()}\n\nA: ${answer.trim()}`);

    backgroundTaskService.queueTask('UPDATE_RAG', id, {
      oldRagFileId: knowledge.ragFileId,
      tempFilePath: tempFile,
      displayName: question.substring(0, 100),
      description: answer.substring(0, 500),
    });

    // Return immediately without waiting for RAG operations
    (res as any).json({
      success: true,
      message: 'Knowledge item queued for update',
      data: {
        id,
        question: question.trim(),
        answer: answer.trim(),
        status: 'PROCESSING',
      },
    });
  } catch (error: any) {
    console.error('❌ Update knowledge error:', error.message);
    (res as any).status(500).json({ success: false, error: error.message });
  }
};

/**
 * DELETE /api/knowledge/:id
 * Queues deletion from both RAG and Firebase asynchronously
 */
export const deleteKnowledge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    if (!id) {
      (res as any).status(400).json({ success: false, error: 'Knowledge ID required' });
      return;
    }

    // Get knowledge metadata from Firebase
    let knowledge = null;
    try {
      knowledge = await firebaseService.getKnowledgeById(id);
      console.log(`📚 Found knowledge item: ${id}, ragFileId: ${knowledge?.ragFileId}`);
    } catch (e) {
      console.warn('⚠️  Could not fetch knowledge from Firebase');
    }

    if (!knowledge) {
      (res as any).status(404).json({ success: false, error: 'Knowledge item not found' });
      return;
    }

    // Delete from Firebase immediately
    try {
      console.log(`🗑️  Deleting from Firebase: ${id}`);
      await firebaseService.deleteKnowledge(id);
      console.log(`✅ Deleted from Firebase`);

      // Delete Docx/PDF file from Firebase Storage if it's that type
      if (knowledge.type === 'pdf' || knowledge.type === 'docx') {
        try {
          await firebaseService.deletePdfFile(id); // Reusing the same service method for both
          console.log(`✅ Deleted ${knowledge.type} file from Storage`);
        } catch (error: any) {
          console.warn(`⚠️  Could not delete ${knowledge.type} file:`, error.message);
        }
      }
    } catch (error: any) {
      console.error('❌ Could not delete from Firebase:', error.message);
      (res as any).status(500).json({ success: false, error: error.message });
      return;
    }

    // Queue RAG deletion in background if we have RAG file IDs
    if (knowledge.ragFileIds && knowledge.ragFileIds.length > 0) {
      backgroundTaskService.queueTask('DELETE_RAG', id, {
        ragFileIds: knowledge.ragFileIds,
      });
      console.log(`📋 Queued RAG deletion for ${knowledge.ragFileIds.length} chunks`);
    } else if (knowledge.ragFileId) {
      backgroundTaskService.queueTask('DELETE_RAG', id, {
        ragFileId: knowledge.ragFileId,
      });
      console.log(`📋 Queued RAG deletion for: ${knowledge.ragFileId}`);
    }

    // Return immediately
    (res as any).json({
      success: true,
      message: 'Knowledge item deleted',
      id,
    });
  } catch (error: any) {
    console.error('❌ Delete knowledge error:', error.message);
    (res as any).status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/knowledge/upload/csv
 * Upload multiple Q&A pairs from CSV - creates individual files for each Q&A
 * Saves to both Vertex AI RAG and Firebase Firestore
 */
export const uploadCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    const items = req.body.items as { question: string; answer: string }[];
    if (!items || !items.length) {
      (res as any).status(400).json({ success: false, error: 'No items provided' });
      return;
    }

    ensureTempDir();
    const uploadedFiles: any[] = [];
    const errors: string[] = [];

    // Upload each Q&A pair as a separate file
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      try {
        const fileId = `csv_qa_${Date.now()}_${i}`;
        const tempFile = path.join(RAG_TEMP_DIR, `${fileId}.txt`);
        const content = `Q: ${item.question.trim()}\n\nA: ${item.answer.trim()}`;

        fs.writeFileSync(tempFile, content);

        // 1. Upload to Vertex AI RAG
        const ragFile = await vertexAIRag.uploadFile(
          tempFile,
          item.question.substring(0, 100),
          item.answer.substring(0, 500)
        );

        // 2. Save metadata to Firebase Firestore
        await firebaseService.saveKnowledge({
          ragFileId: ragFile.name,
          question: item.question.trim(),
          answer: item.answer.trim(),
          type: 'csv',
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        uploadedFiles.push(ragFile);

        try { fs.unlinkSync(tempFile); } catch (e) { }
      } catch (error: any) {
        console.error(`❌ CSV row ${i + 1} error:`, error);
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    (res as any).status(201).json({
      success: true,
      message: `Uploaded ${uploadedFiles.length} of ${items.length} items`,
      data: {
        successful: uploadedFiles.length,
        failed: errors.length,
        total: items.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error: any) {
    console.error('❌ CSV upload error:', error);
    (res as any).status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/knowledge/upload/docx
 * Upload a DOCX/DOC file - extracts text, chunks it, and uploads as text files
 * Saves to both Vertex AI RAG and Firebase Firestore + Storage
 */
export const uploadDocx = async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename, content, title, description } = req.body;

    if (!filename || !content) {
      (res as any).status(400).json({ success: false, error: 'Filename and content are required' });
      return;
    }

    ensureTempDir();

    try {
      // 1. Convert base64 to buffer
      const buffer = Buffer.from(content, 'base64');

      // 2. Save original file to temp for extraction
      const tempDocxPath = path.join(RAG_TEMP_DIR, `origin_${Date.now()}_${filename}`);
      fs.writeFileSync(tempDocxPath, buffer);

      // 3. Extract text using mammoth
      let extractedText = "";
      try {
        const result = await mammoth.extractRawText({ path: tempDocxPath });
        extractedText = result.value;
        console.log(`📄 Extracted ${extractedText.length} characters from docx`);
      } catch (extractError) {
        console.error('❌ Mammoth extraction failed:', extractError);
        throw new Error('Failed to extract text from document. Make sure it is a valid .docx file.');
      }

      // 4. Chunk text
      const chunks = chunkText(extractedText);
      console.log(`📦 Split text into ${chunks.length} chunks`);

      // 5. Save metadata to Firebase Firestore first (to get ID)
      const knowledge = await firebaseService.saveKnowledge({
        ragFileId: '',
        ragFileIds: [],
        question: title || filename,
        answer: description || (extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : '')),
        type: 'docx',
        status: 'PROCESSING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 6. Upload original file to Firebase Storage (for reference/download)
      let fileUrl = '';
      try {
        fileUrl = await firebaseService.uploadPdfFile(buffer, filename, knowledge.id);
        console.log(`✅ Original file uploaded to Firebase Storage: ${fileUrl}`);
      } catch (storageError: any) {
        console.error('❌ Failed to upload to Firebase Storage:', storageError.message);
      }

      // 7. Update knowledge metadata with file URL
      if (fileUrl) {
        await firebaseService.updateKnowledge(knowledge.id, {
          fileUrl,
        });
      }

      // 8. Create temporary text files for chunks
      const chunkFilePaths: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunkPath = path.join(RAG_TEMP_DIR, `chunk_${knowledge.id}_${i}.txt`);
        fs.writeFileSync(chunkPath, chunks[i]);
        chunkFilePaths.push(chunkPath);
      }

      // 9. Queue RAG upload task for chunks
      backgroundTaskService.queueTask('UPLOAD_RAG', knowledge.id, {
        tempFilePaths: chunkFilePaths,
        displayName: title || filename.substring(0, 100),
        description: description || `Extracted from: ${filename}`,
      });

      // Clean up the original temp docx file (chunks will be cleaned up by the background task)
      try { fs.unlinkSync(tempDocxPath); } catch (e) { }

      (res as any).status(201).json({
        success: true,
        message: 'Document uploaded and processing started',
        data: {
          id: knowledge.id,
          title: knowledge.question,
          filename,
          type: 'docx',
          fileUrl,
          chunksCount: chunks.length,
          createdAt: knowledge.createdAt,
        }
      });
    } catch (error: any) {
      console.error('❌ Docx upload processing error:', error);
      (res as any).status(500).json({ success: false, error: error.message });
    }
  } catch (error: any) {
    console.error('❌ Docx upload error:', error);
    (res as any).status(500).json({ success: false, error: error.message });
  }
};

/**
 * @deprecated Use uploadDocx instead
 * PDF support is being replaced by Docx
 */
export const uploadPDF = async (req: Request, res: Response): Promise<void> => {
  (res as any).status(400).json({
    success: false,
    error: 'PDF support has been replaced by DOCX support. Please upload .docx files instead.'
  });
};

/**
 * POST /api/knowledge/batch-delete
 */
export const batchDeleteKnowledge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      (res as any).status(400).json({ success: false, error: 'No IDs provided' });
      return;
    }

    const results = { successful: 0, failed: 0 };

    for (const id of ids) {
      try {
        const knowledge = await firebaseService.getKnowledgeById(id);
        if (knowledge) {
          await firebaseService.deleteKnowledge(id);
          if (knowledge.type === 'pdf' || knowledge.type === 'docx') {
            try { await firebaseService.deletePdfFile(id); } catch (e) { }
          }
          if (knowledge.ragFileIds && knowledge.ragFileIds.length > 0) {
            backgroundTaskService.queueTask('DELETE_RAG', id, { ragFileIds: knowledge.ragFileIds });
          } else if (knowledge.ragFileId) {
            backgroundTaskService.queueTask('DELETE_RAG', id, { ragFileId: knowledge.ragFileId });
          }
          results.successful++;
        } else {
          results.failed++;
        }
      } catch (err: any) {
        results.failed++;
      }
    }

    (res as any).json({ success: true, message: `Deleted ${results.successful} items`, data: results });
  } catch (error: any) {
    (res as any).status(500).json({ success: false, error: error.message });
  }
};