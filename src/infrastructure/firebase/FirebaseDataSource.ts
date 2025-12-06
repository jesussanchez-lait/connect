import { db } from "./config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  onSnapshot,
  QueryConstraint,
  serverTimestamp,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  Unsubscribe,
} from "firebase/firestore";

/**
 * Generic Firebase DataSource for CRUD operations and real-time streams
 */
export class FirebaseDataSource<T extends DocumentData> {
  constructor(private collectionName: string) {}

  /**
   * Get a single document by ID
   */
  async getById(id: string): Promise<T | null> {
    if (!db) {
      throw new Error("Firestore no está inicializado");
    }

    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return this.mapDocument(docSnap);
    } catch (error: any) {
      console.error(
        `Error getting document ${id} from ${this.collectionName}:`,
        error
      );
      throw new Error(
        error.message ||
          `Error al obtener el documento de ${this.collectionName}`
      );
    }
  }

  /**
   * Get all documents from the collection
   */
  async getAll(constraints?: QueryConstraint[]): Promise<T[]> {
    if (!db) {
      throw new Error("Firestore no está inicializado");
    }

    try {
      let q = query(collection(db, this.collectionName));

      if (constraints && constraints.length > 0) {
        q = query(collection(db, this.collectionName), ...constraints);
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => this.mapDocument(doc));
    } catch (error: any) {
      console.error(
        `Error getting all documents from ${this.collectionName}:`,
        error
      );
      throw new Error(
        error.message || `Error al obtener documentos de ${this.collectionName}`
      );
    }
  }

  /**
   * Query documents with filters
   */
  async query(constraints: QueryConstraint[]): Promise<T[]> {
    if (!db) {
      throw new Error("Firestore no está inicializado");
    }

    try {
      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => this.mapDocument(doc));
    } catch (error: any) {
      console.error(`Error querying ${this.collectionName}:`, error);
      throw new Error(
        error.message || `Error al consultar ${this.collectionName}`
      );
    }
  }

  /**
   * Create a new document
   */
  async create(
    data: Omit<T, "id" | "createdAt" | "updatedAt">,
    id?: string
  ): Promise<T> {
    if (!db) {
      throw new Error("Firestore no está inicializado");
    }

    try {
      const docId = id || doc(collection(db, this.collectionName)).id;
      const docRef = doc(db, this.collectionName, docId);

      // Convert Date objects to Firestore Timestamps
      const dataForFirestore = this.convertDatesToTimestamps(data);

      const dataWithTimestamps = {
        ...dataForFirestore,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      } as any;

      await setDoc(docRef, dataWithTimestamps);

      // Return the created document
      const createdDoc = await getDoc(docRef);
      if (!createdDoc.exists()) {
        throw new Error("Error al crear el documento");
      }

      return this.mapDocument(createdDoc);
    } catch (error: any) {
      console.error(
        `Error creating document in ${this.collectionName}:`,
        error
      );
      throw new Error(
        error.message || `Error al crear documento en ${this.collectionName}`
      );
    }
  }

  /**
   * Update an existing document
   */
  async update(
    id: string,
    data: Partial<Omit<T, "id" | "createdAt">>
  ): Promise<T> {
    if (!db) {
      throw new Error("Firestore no está inicializado");
    }

    try {
      const docRef = doc(db, this.collectionName, id);

      // Convert Date objects to Firestore Timestamps
      const dataForFirestore = this.convertDatesToTimestamps(data);

      const updateData = {
        ...dataForFirestore,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, updateData);

      // Return the updated document
      const updatedDoc = await getDoc(docRef);
      if (!updatedDoc.exists()) {
        throw new Error("Documento no encontrado después de actualizar");
      }

      return this.mapDocument(updatedDoc);
    } catch (error: any) {
      console.error(
        `Error updating document ${id} in ${this.collectionName}:`,
        error
      );
      throw new Error(
        error.message ||
          `Error al actualizar documento en ${this.collectionName}`
      );
    }
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<void> {
    if (!db) {
      throw new Error("Firestore no está inicializado");
    }

    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error: any) {
      console.error(
        `Error deleting document ${id} from ${this.collectionName}:`,
        error
      );
      throw new Error(
        error.message || `Error al eliminar documento de ${this.collectionName}`
      );
    }
  }

  /**
   * Subscribe to real-time updates for a single document
   */
  subscribeToDocument(
    id: string,
    callback: (data: T | null) => void
  ): Unsubscribe {
    if (!db) {
      throw new Error("Firestore no está inicializado");
    }

    const docRef = doc(db, this.collectionName, id);

    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(this.mapDocument(docSnap));
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error(`Error subscribing to document ${id}:`, error);
        callback(null);
      }
    );
  }

  /**
   * Subscribe to real-time updates for the entire collection
   */
  subscribeToCollection(
    callback: (data: T[]) => void,
    constraints?: QueryConstraint[]
  ): Unsubscribe {
    if (!db) {
      throw new Error("Firestore no está inicializado");
    }

    let q = query(collection(db, this.collectionName));

    if (constraints && constraints.length > 0) {
      q = query(collection(db, this.collectionName), ...constraints);
    }

    return onSnapshot(
      q,
      (querySnapshot) => {
        const documents = querySnapshot.docs.map((doc) =>
          this.mapDocument(doc)
        );
        callback(documents);
      },
      (error) => {
        console.error(
          `Error subscribing to collection ${this.collectionName}:`,
          error
        );
        callback([]);
      }
    );
  }

  /**
   * Map Firestore document to application model
   * Converts Timestamps to Dates and adds id field
   */
  private mapDocument(docSnap: QueryDocumentSnapshot<DocumentData>): T {
    const data = docSnap.data();
    const mapped: any = {
      id: docSnap.id,
      ...data,
    };

    // Convert Firestore Timestamps to JavaScript Dates
    Object.keys(mapped).forEach((key) => {
      if (mapped[key] instanceof Timestamp) {
        mapped[key] = mapped[key].toDate();
      }
    });

    return mapped as T;
  }

  /**
   * Convert Date objects to Firestore Timestamps
   */
  private convertDatesToTimestamps(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (data instanceof Date) {
      return Timestamp.fromDate(data);
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.convertDatesToTimestamps(item));
    }

    if (typeof data === "object") {
      const converted: any = {};
      Object.keys(data).forEach((key) => {
        const value = data[key];
        if (value instanceof Date) {
          converted[key] = Timestamp.fromDate(value);
        } else if (typeof value === "object" && value !== null) {
          converted[key] = this.convertDatesToTimestamps(value);
        } else {
          converted[key] = value;
        }
      });
      return converted;
    }

    return data;
  }

  /**
   * Get multiple documents by their IDs
   */
  async getByIds(ids: string[]): Promise<T[]> {
    if (!db) {
      throw new Error("Firestore no está inicializado");
    }

    if (!ids || ids.length === 0) {
      return [];
    }

    try {
      if (!db) {
        throw new Error("Firestore no está inicializado");
      }

      const dbInstance = db; // TypeScript guard

      // Obtener cada documento por su ID en paralelo
      const docPromises = ids.map((id) => {
        const docRef = doc(dbInstance, this.collectionName, id);
        return getDoc(docRef);
      });

      const docSnaps = await Promise.all(docPromises);

      // Mapear solo los documentos que existen
      const documents = docSnaps
        .filter((docSnap) => docSnap.exists())
        .map((docSnap) =>
          this.mapDocument(docSnap as QueryDocumentSnapshot<DocumentData>)
        );

      return documents;
    } catch (error: any) {
      console.error(
        `Error getting documents by IDs from ${this.collectionName}:`,
        error
      );
      throw new Error(
        error.message ||
          `Error al obtener documentos por IDs de ${this.collectionName}`
      );
    }
  }

  /**
   * Helper methods for common query constraints
   */
  static where(
    field: string,
    operator: "<" | "<=" | "==" | "!=" | ">=" | ">",
    value: any
  ) {
    return where(field, operator, value);
  }

  static orderBy(field: string, direction: "asc" | "desc" = "asc") {
    return orderBy(field, direction);
  }

  static limit(count: number) {
    return firestoreLimit(count);
  }
}
