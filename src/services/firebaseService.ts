/**
 * Firebase Service
 * Stores knowledge base metadata (Q&A pairs) in Firestore
 * while Vertex AI RAG stores the actual document content for semantic search
 */

import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

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

// Define the Admin User structure
interface AdminUser {
  uid: string;
  email: string;
  role: 'admin' | 'editor';
}

class FirebaseService {
  private db: admin.firestore.Firestore | null = null;
  private auth: admin.auth.Auth | null = null;
  private initialized: boolean = false;
  // Fallback to 'chitbot-rag' if FIRESTORE_DATABASE_ID is not in .env
  private databaseId: string = process.env.FIRESTORE_DATABASE_ID || 'chatbot-rag';

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
      console.log(`Target Project: ${process.env.PROJECT_ID}`);
      console.log(`Target Database: ${this.databaseId}`);

      // Initialize Firebase Admin with ADC (same auth as Vertex AI)
      if (!admin.apps.length) {
        admin.initializeApp({
          projectId: process.env.PROJECT_ID,
        });
      }

      /**
       * CRITICAL FIX: Explicitly target the named database.
       * If your database in GCP is named 'chitbot-rag', calling admin.firestore() 
       * without arguments will look for '(default)' and return a NOT_FOUND error.
       */
      this.db = getFirestore(this.databaseId);
      
      // Initialize Auth
      this.auth = getAuth();
      
      this.initialized = true;

      console.log(`✅ Firebase Service initialized for database: ${this.databaseId}`);
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
   * 🔐 Verify Admin Token
   * 1. Decodes the ID Token sent from Frontend
   * 2. Checks if the user exists in the 'admins' Firestore collection
   */
  async verifyAdminToken(idToken: string): Promise<AdminUser> {
    if (!this.auth || !this.db) {
      await this.initialize();
    }

    try {
      // 1. Verify the integrity of the token with Firebase Auth
      const decodedToken = await this.auth!.verifyIdToken(idToken);
      const { email, uid } = decodedToken;

      // 2. Check Authorization: Is this user in our 'admins' collection?
      // Check by UID (preferred)
      let adminDoc = await this.db!.collection('admins').doc(uid).get();
      
      // Fallback: Check by email if UID doc doesn't exist yet
      if (!adminDoc.exists && email) {
        const emailQuery = await this.db!.collection('admins').where('email', '==', email).limit(1).get();
        if (!emailQuery.empty) {
          adminDoc = emailQuery.docs[0];
        }
      }

      if (!adminDoc.exists) {
        console.warn(`⚠️ Unauthorized access attempt by ${email} (${uid})`);
        throw new Error('Unauthorized: User is not in the admins list');
      }

      const data = adminDoc.data();
      return { 
        uid, 
        email: email!, 
        role: data?.role || 'admin' 
      };

    } catch (error) {
      console.error('Auth Verification Failed:', error);
      throw new Error('Unauthorized');
    }
  }

  /**
   * Save knowledge metadata to Firestore
   */
  async saveKnowledge(data: Omit<KnowledgeMetadata, 'id'>): Promise<KnowledgeMetadata> {
    if (!this.db) await this.initialize();

    try {
      const docRef = await this.db!.collection('knowledge').add({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const doc = await docRef.get();
      const docData = doc.data();

      return {
        id: doc.id,
        ...docData,
        // Convert Firestore timestamps to strings for the frontend
        createdAt: docData?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: docData?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as KnowledgeMetadata;
    } catch (error: any) {
      if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
        console.error(`❌ Firestore Database "${this.databaseId}" not found or API not enabled.`);
        console.warn('💡 Ensure the database ID matches exactly what you see in the GCP Console.');
        
        // Return a mock saved item so RAG process doesn't crash the whole flow
        return {
          id: `mock_${Math.random().toString(36).substr(2, 9)}`,
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as KnowledgeMetadata;
      }
      throw error;
    }
  }

  /**
   * Get all knowledge items
   */
  async getAllKnowledge(): Promise<KnowledgeMetadata[]> {
    if (!this.db) await this.initialize();

    try {
      const snapshot = await this.db!.collection('knowledge').orderBy('createdAt', 'desc').get();

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      }) as KnowledgeMetadata[];
    } catch (error: any) {
      // If collection doesn't exist or is empty, return empty array
      if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
        console.log('ℹ️  Knowledge collection is empty or database not found');
        return [];
      }
      throw error;
    }
  }

  /**
   * Get knowledge by ID
   */
  async getKnowledgeById(id: string): Promise<KnowledgeMetadata | null> {
    if (!this.db) await this.initialize();

    const doc = await this.db!.collection('knowledge').doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as KnowledgeMetadata;
  }

  /**
   * Get knowledge by RAG file ID
   */
  async getKnowledgeByRagFileId(ragFileId: string): Promise<KnowledgeMetadata | null> {
    if (!this.db) await this.initialize();

    const snapshot = await this.db!.collection('knowledge').where('ragFileId', '==', ragFileId).limit(1).get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as KnowledgeMetadata;
  }

  /**
   * Update knowledge metadata
   */
  async updateKnowledge(id: string, data: Partial<KnowledgeMetadata>): Promise<void> {
    if (!this.db) await this.initialize();

    await this.db!.collection('knowledge').doc(id).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  /**
   * Delete knowledge metadata
   */
  async deleteKnowledge(id: string): Promise<void> {
    if (!this.db) await this.initialize();

    await this.db!.collection('knowledge').doc(id).delete();
  }

  /**
   * Delete knowledge by RAG file ID
   */
  async deleteKnowledgeByRagFileId(ragFileId: string): Promise<void> {
    if (!this.db) await this.initialize();

    const snapshot = await this.db!.collection('knowledge').where('ragFileId', '==', ragFileId).get();

    if (snapshot.empty) return;

    const batch = this.db!.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }

  /**
   * Get knowledge count
   */
  async getKnowledgeCount(): Promise<number> {
    if (!this.db) await this.initialize();

    try {
      const snapshot = await this.db!.collection('knowledge').count().get();
      return snapshot.data().count;
    } catch (error: any) {
      if (error.code === 5) return 0;
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();
export default firebaseService;