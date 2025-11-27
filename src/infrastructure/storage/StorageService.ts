export interface IStorageService {
  setItem(key: string, value: string): void;
  getItem(key: string): string | null;
  removeItem(key: string): void;
}

export class LocalStorageService implements IStorageService {
  setItem(key: string, value: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  }

  getItem(key: string): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  }

  removeItem(key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
}

