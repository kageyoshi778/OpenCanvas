// src/components/RealtimeSync.js
import { useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, set } from 'firebase/database';

export const useRealtimeSync = (strokes, setStrokes) => {
  // Listen for updates
  useEffect(() => {
    const strokesRef = ref(db, 'strokes');
    const unsubscribe = onValue(strokesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Array.isArray(data) ? data : Object.values(data);
        setStrokes(list);
      }
    });
    return () => unsubscribe();
  }, [setStrokes]);

  // Push updates (debounced)
  useEffect(() => {
    const strokesRef = ref(db, 'strokes');
    const timeout = setTimeout(() => {
      set(strokesRef, strokes);
    }, 300);
    return () => clearTimeout(timeout);
  }, [strokes]);
};
