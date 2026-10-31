import { IWeddingStorage } from './types';
import { LocalWeddingStorage } from './localStorage';
import { FirestoreWeddingStorage } from './firestoreStorage';

let cachedStorage: IWeddingStorage | null = null;

export function getWeddingStorage(): IWeddingStorage {
  if (cachedStorage) {
    return cachedStorage;
  }

  const driver = process.env.STORAGE_DRIVER;
  if (driver === 'firestore') {
    cachedStorage = new FirestoreWeddingStorage();
  } else {
    cachedStorage = new LocalWeddingStorage();
  }

  return cachedStorage!;
}

export * from './types';
