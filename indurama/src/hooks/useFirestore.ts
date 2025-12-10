import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  QuerySnapshot, 
  DocumentData,
  where,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

/**
 * Hook para escuchar documentos de Firestore en tiempo real
 */
export const useFirestoreCollection = <T>(
  collectionName: string,
  constraints: any[] = []
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const q = query(collection(db, collectionName), ...constraints);
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const documents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as T[];
          
          setData(documents);
          setLoading(false);
        },
        (err) => {
          console.error('Firestore error:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.error('Error setting up Firestore listener:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLoading(false);
    }
  }, [collectionName, JSON.stringify(constraints)]);

  return { data, loading, error };
};

/**
 * Hook para paginación de Firestore
 */
export const useFirestorePagination = <T>(
  collectionName: string,
  pageSize: number = 10,
  orderField: string = 'createdAt'
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    
    try {
      let q = query(
        collection(db, collectionName),
        orderBy(orderField, 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(
          collection(db, collectionName),
          orderBy(orderField, 'desc'),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const newDocs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];

        if (snapshot.docs.length < pageSize) {
          setHasMore(false);
        }

        if (snapshot.docs.length > 0) {
          setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
          setData(prev => lastDoc ? [...prev, ...newDocs] : newDocs);
        }

        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading more data:', error);
      setLoading(false);
    }
  };

  const reset = () => {
    setData([]);
    setLastDoc(null);
    setHasMore(true);
  };

  return {
    data,
    loading,
    hasMore,
    loadMore,
    reset,
  };
};