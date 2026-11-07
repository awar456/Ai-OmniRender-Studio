/**
 * IndexedDB Persistence Layer for OmniRender AI Studio Pro
 * Database: omni_render_db
 */

export interface GenerationRecord {
  id: string;
  type: 'video' | 'image' | 'variations' | 'music';
  mode: string;
  title: string;
  prompt: string;
  sourceImage?: string;
  outputUrl: string;
  secondaryOutputs?: {
    id: string;
    title: string;
    url: string;
    filter: string;
    promptModifier?: string;
  }[];
  lyrics?: string;
  metadata: {
    aspectRatio: string;
    imageSize?: string;
    model: string;
    eraPreset: string;
    cameraProfile: string;
    motionIntensity: number;
    blendWeight: number;
    duration?: string;
    resolution?: string;
    timestamp: number;
  };
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model: string;
  agentRole: string;
  timestamp: number;
}

const DB_NAME = 'omni_render_db';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('generations')) {
        const genStore = db.createObjectStore('generations', { keyPath: 'id' });
        genStore.createIndex('createdAt', 'createdAt', { unique: false });
        genStore.createIndex('type', 'type', { unique: false });
      }

      if (!db.objectStoreNames.contains('chatHistory')) {
        const chatStore = db.createObjectStore('chatHistory', { keyPath: 'id' });
        chatStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains('presets')) {
        db.createObjectStore('presets', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveGeneration(record: GenerationRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('generations', 'readwrite');
    const store = transaction.objectStore('generations');
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllGenerations(): Promise<GenerationRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('generations', 'readonly');
    const store = transaction.objectStore('generations');
    const index = store.index('createdAt');
    const req = index.getAll();
    req.onsuccess = () => {
      const results = (req.result || []) as GenerationRecord[];
      // Return newest first
      resolve(results.reverse());
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteGeneration(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('generations', 'readwrite');
    const store = transaction.objectStore('generations');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllGenerations(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('generations', 'readwrite');
    const store = transaction.objectStore('generations');
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function saveChatMessage(msg: ChatMessage): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chatHistory', 'readwrite');
    const store = transaction.objectStore('chatHistory');
    const req = store.put(msg);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getChatHistory(): Promise<ChatMessage[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chatHistory', 'readonly');
    const store = transaction.objectStore('chatHistory');
    const index = store.index('timestamp');
    const req = index.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function clearChatHistory(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chatHistory', 'readwrite');
    const store = transaction.objectStore('chatHistory');
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
