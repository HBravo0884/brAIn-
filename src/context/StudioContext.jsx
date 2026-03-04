import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { storage } from '../utils/storage';
import { INITIAL_STUDENTS } from '../data/initialStudents';
import { StudentSchema, validateSafe } from '../utils/schemas';
import { syncEntity, pullEntityFromSupabase, mergeWithSupabase, isSupabaseEnabled } from '../utils/supabase';

const StudioContext = createContext();

export const useStudio = () => {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudio must be used within StudioProvider');
  }
  return context;
};

export const StudioProvider = ({ children }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Seed from storage or INITIAL_STUDENTS on mount
  useEffect(() => {
    const stored = storage.getStudents();
    if (stored.length === 0) {
      const now = new Date().toISOString();
      const seed = INITIAL_STUDENTS.map(s => ({
        ...s,
        id: crypto.randomUUID(),
        lessonLogs: [],
        createdAt: now,
        updatedAt: now,
      }));
      storage.setStudents(seed);
      setStudents(seed);
    } else {
      setStudents(stored);
    }
    setLoading(false);
  }, []);

  // Pull students from Supabase on mount — merge newer records
  useEffect(() => {
    if (loading || !isSupabaseEnabled()) return;
    pullEntityFromSupabase('students').then(remote => {
      if (remote?.length) setStudents(prev => mergeWithSupabase(prev, remote));
    }).catch(() => {});
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist students to localStorage (debounced) + sync to Supabase
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      storage.setStudents(students);
      if (isSupabaseEnabled()) syncEntity('students', students).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [students, loading]);

  const addStudent = (student) => {
    if (!validateSafe(StudentSchema, student, 'student')) return;
    setStudents(prev => [...prev, {
      id: crypto.randomUUID(),
      lessonLogs: [],
      ...student,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }]);
  };

  const updateStudent = (id, updates) => {
    setStudents(prev => prev.map(s =>
      s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
    ));
  };

  const deleteStudent = (id) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const addLessonLog = (studentId, log) => {
    setStudents(prev => prev.map(s =>
      s.id === studentId
        ? {
            ...s,
            lessonLogs: [
              ...(s.lessonLogs || []),
              { id: crypto.randomUUID(), ...log, createdAt: new Date().toISOString() },
            ],
            updatedAt: new Date().toISOString(),
          }
        : s
    ));
  };

  const value = useMemo(() => ({
    students,
    loading,
    addStudent,
    updateStudent,
    deleteStudent,
    addLessonLog,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [students, loading]);

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
};
