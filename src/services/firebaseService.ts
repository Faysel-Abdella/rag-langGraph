/**
 * Firebase Service
 * Stores knowledge base metadata (Q&A pairs) in Firestore
 * while Vertex AI RAG stores the actual document content for semantic search
 */

import admin from 'firebase-admin';

interface KnowledgeMetadata {
  id: string;
  ragFileId: string; // ID from Vertex AI RAG
  question: string;
  answer: string;
  type: 'manual' | 'csv' | 'pdf' | 'docx';
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

class FirebaseService {
  private db: admin.firestore.Firestore | null = null;
  private initialized: boolean = false;

  /**
   * Initialize Firebase Admin SDK
   * Uses Application Default Credentials (same as Vertex AI)
   */
  async initialize(): Promise<void> {
    try {
      if (this.initialized) {
        return;
      }

      console.log('\n🔥 Initializing Firebase Service...');

      // Initialize Firebase Admin with ADC (same auth as Vertex AI)
      if (!admin.apps.length) {
        admin.initializeApp({
          projectId: process.env.PROJECT_ID,
        });
      }

      this.db = admin.firestore();
      this.initialized = true;

      console.log('✅ Firebase Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase:', error);
      throw error;
    }
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.db !== null;
  }

  /**
   * Save knowledge metadata to Firestore
   */
  async saveKnowledge(data: Omit<KnowledgeMetadata, 'id'>): Promise<KnowledgeMetadata> {
    if (!this.db) throw new Error('Firebase not initialized');

    const docRef = await this.db.collection('knowledge').add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const doc = await docRef.get();
    return {
      id: doc.id,
      ...doc.data(),
    } as KnowledgeMetadata;
  }

  /**
   * Get all knowledge items
   */
  async getAllKnowledge(): Promise<KnowledgeMetadata[]> {
    if (!this.db) throw new Error('Firebase not initialized');

    const snapshot = await this.db.collection('knowledge').orderBy('createdAt', 'desc').get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    })) as KnowledgeMetadata[];
  }

  /**
   * Get knowledge by ID
   */
  async getKnowledgeById(id: string): Promise<KnowledgeMetadata | null> {
    if (!this.db) throw new Error('Firebase not initialized');

    const doc = await this.db.collection('knowledge').doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data()?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as KnowledgeMetadata;
  }

  /**
   * Get knowledge by RAG file ID
   */
  async getKnowledgeByRagFileId(ragFileId: string): Promise<KnowledgeMetadata | null> {
    if (!this.db) throw new Error('Firebase not initialized');

    const snapshot = await this.db.collection('knowledge').where('ragFileId', '==', ragFileId).limit(1).get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as KnowledgeMetadata;
  }

  /**
   * Update knowledge metadata
   */
  async updateKnowledge(id: string, data: Partial<KnowledgeMetadata>): Promise<void> {
    if (!this.db) throw new Error('Firebase not initialized');

    await this.db.collection('knowledge').doc(id).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  /**
   * Delete knowledge metadata
   */
  async deleteKnowledge(id: string): Promise<void> {
    if (!this.db) throw new Error('Firebase not initialized');

    await this.db.collection('knowledge').doc(id).delete();
  }

  /**
   * Delete knowledge by RAG file ID
   */
  async deleteKnowledgeByRagFileId(ragFileId: string): Promise<void> {
    if (!this.db) throw new Error('Firebase not initialized');

    const snapshot = await this.db.collection('knowledge').where('ragFileId', '==', ragFileId).get();

    const batch = this.db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }

  /**
   * Get knowledge count
   */
  async getKnowledgeCount(): Promise<number> {
    if (!this.db) throw new Error('Firebase not initialized');

    const snapshot = await this.db.collection('knowledge').count().get();
    return snapshot.data().count;
  }
}

export const firebaseService = new FirebaseService();
export default firebaseService;
