import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/core/utils/supabase';
import { Note, NotePriority, NoteWorkStatus } from '../../domain/entities/note';
import { useRouter } from 'next/navigation';
import {
  extractDescriptionFromContent,
  normalizeToDelta,
} from '../utils/deltaContent';

export function useNoteDetails(noteId: string, userId: string | undefined) {
  const [note, setNote] = useState<Partial<Note>>({
    title: '',
    content: { ops: [] },
    tags: [],
    isFavorite: false,
    enabledProperties: ['date'],
  });
  
  const [loading, setLoading] = useState(noteId !== 'new');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  
  const router = useRouter();
  const isNew = noteId === 'new';
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTags = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await (supabase as any)
        .from('user_tags')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setAvailableTags(data.map((row: any) => ({
          id: row.id,
          name: row.name,
          colorHex: row.color_hex
        })));
      }
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  }, [userId]);

  const fetchNote = useCallback(async () => {
    if (isNew || !userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      if (data) {
        const d = data as any;
        setNote({
          id: d.id,
          userId: d.user_id,
          title: d.title || '',
          content: normalizeToDelta(d.content),
          milestoneId: d.milestone_id || undefined,
          noteDate: d.note_date || undefined,
          tags: Array.isArray(d.tags) ? d.tags : [],
          priority: d.priority as NotePriority | undefined,
          status: d.status === 'not_started' ? NoteWorkStatus.notStarted :
                  d.status === 'in_progress' ? NoteWorkStatus.inProgress :
                  d.status === 'done' ? NoteWorkStatus.done : undefined,
          description: d.description || undefined,
          isFavorite: d.is_favorite || false,
          enabledProperties: Array.isArray(d.enabled_properties) ? d.enabled_properties : ['date'],
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        });
      }
    } catch (err: any) {
      console.error('Error fetching note details:', err.message);
      setError('Failed to load note.');
    } finally {
      setLoading(false);
    }
  }, [noteId, userId, isNew]);

  useEffect(() => {
    let mounted = true;
    if (userId && mounted) {
      if (!isNew) fetchNote();
      fetchTags();
    }
    return () => { mounted = false; };
  }, [userId, fetchNote, fetchTags, isNew]);

  const createTag = async (name: string, colorHex: string) => {
    if (!userId) return;
    try {
      const { data, error } = await (supabase as any)
        .from('user_tags')
        .insert({ user_id: userId, name, color_hex: colorHex })
        .select()
        .single();
      
      if (!error && data) {
        setAvailableTags(prev => [{
          id: data.id,
          name: data.name,
          colorHex: data.color_hex
        }, ...prev]);
      }
    } catch (err) {
      console.error('Error creating tag:', err);
    }
  };

  const hasMeaningfulContent = useCallback((contentJSON: any): boolean => {
    const delta = normalizeToDelta(contentJSON);
    for (const op of delta.ops) {
      if (typeof op.insert === 'object') return true;
      if (typeof op.insert === 'string' && op.insert.replace(/\n/g, '').trim().length > 0) {
        return true;
      }
    }
    return false;
  }, []);

  const saveNote = useCallback(async (
    title: string, 
    contentJSON: any, 
    extraProps?: Partial<Note>,
    isAutoSave = false
  ) => {
    if (!userId) return;

    try {
      setSaving(true);
      setError(null);

      const normalizedContent = normalizeToDelta(contentJSON);
      const persistedContent = JSON.parse(
        JSON.stringify(normalizedContent),
      );
      const description = extractDescriptionFromContent(persistedContent);
      const now = new Date().toISOString();
      
      // Build upsert payload matching Flutter's NoteModel.toJson()
      const currentStatus = extraProps?.status ?? note.status;
      const statusStr = currentStatus === NoteWorkStatus.notStarted ? 'not_started' :
                        currentStatus === NoteWorkStatus.inProgress ? 'in_progress' :
                        currentStatus === NoteWorkStatus.done ? 'done' : null;

      const payload: Record<string, any> = {
        user_id: userId,
        title: title || 'Untitled',
        content: persistedContent,
        description,
        updated_at: now,
        tags: extraProps?.tags ?? note.tags ?? [],
        is_favorite: extraProps?.isFavorite ?? note.isFavorite ?? false,
        enabled_properties: extraProps?.enabledProperties ?? note.enabledProperties ?? ['date'],
        priority: extraProps?.priority ?? note.priority ?? null,
        status: statusStr,
        milestone_id: extraProps?.milestoneId ?? note.milestoneId ?? null,
        note_date: extraProps?.noteDate ?? note.noteDate ?? null,
      };

      if (isNew && !note.id) {
        // Create: let DB generate ID
        payload.created_at = now;
        payload.note_date = new Date().toISOString().split('T')[0]; // Default today

        const { data, error } = await (supabase as any)
          .from('notes')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        
        if (data) {
          const d = data as any;
          setNote(prev => ({
            ...prev,
            id: d.id,
            userId: d.user_id,
            title: d.title,
            content: normalizeToDelta(d.content),
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
          router.replace(`/notes/${d.id}`, { scroll: false });
        }
      } else {
        // Update existing note via upsert
        const targetId = note.id || noteId;
        payload.id = targetId;

        const { data, error } = await (supabase as any)
          .from('notes')
          .upsert(payload)
          .select()
          .single();

        if (error) throw error;
        
        if (data) {
          setNote(prev => ({ ...prev, title, content: persistedContent, updatedAt: now }));
        }
      }
    } catch (err: any) {
      console.error('Error saving note:', err);
      setError(err?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }, [userId, isNew, note.id, note.tags, note.isFavorite, note.enabledProperties, note.priority, note.status, note.milestoneId, note.noteDate, noteId, router]);


  // Debounced Auto-save
  const autoSave = useCallback((title: string, contentJSON: any, extraProps?: Partial<Note>) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    // For brand-new note: skip empty saves. For existing note: always save changes.
    if (isNew && !note.id && title.trim() === '' && !hasMeaningfulContent(contentJSON)) {
       return; 
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveNote(title, contentJSON, extraProps, true);
    }, 2000); // 2 seconds debounce
  }, [saveNote, hasMeaningfulContent, isNew, note.id]);


  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  return {
    note,
    loading,
    saving,
    error,
    availableTags,
    createTag,
    saveNote,
    autoSave,
    setLocalNoteState: (updates: Partial<Note>) => setNote(prev => ({ ...prev, ...updates }))
  };
}
