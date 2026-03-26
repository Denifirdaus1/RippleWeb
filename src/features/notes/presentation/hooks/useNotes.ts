import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/core/utils/supabase';
import { Note, NotePriority, NoteWorkStatus } from '../../domain/entities/note';
import { Folder, FolderNote } from '../../domain/entities/folder';
import { normalizeToDelta } from '../utils/deltaContent';

const mapNoteFromDb = (row: any): Note => ({
  id: row.id,
  userId: row.user_id,
  title: row.title || '',
  content: normalizeToDelta(row.content),
  milestoneId: row.milestone_id || undefined,
  noteDate: row.note_date || undefined,
  tags: Array.isArray(row.tags) ? row.tags : [],
  priority: row.priority as NotePriority | undefined,
  status: row.status === 'not_started' ? NoteWorkStatus.notStarted :
          row.status === 'in_progress' ? NoteWorkStatus.inProgress :
          row.status === 'done' ? NoteWorkStatus.done : undefined,
  description: row.description || undefined,
  isFavorite: row.is_favorite || false,
  enabledProperties: Array.isArray(row.enabled_properties) ? row.enabled_properties : ['date'],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapFolderFromDb = (row: any): Folder => ({
  id: row.id,
  userId: row.user_id,
  name: row.name || '',
  parentFolderId: row.parent_folder_id || undefined,
  colorHex: row.color || row.color_hex || undefined,
  iconPath: row.icon || row.icon_path || undefined,
  color: row.color || row.color_hex || undefined,
  icon: row.icon || row.icon_path || undefined,
  orderIndex: typeof row.order_index === 'number' ? row.order_index : 0,
  isSystem: row.is_system === true,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function useNotes(userId: string | undefined) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderNotes, setFolderNotes] = useState<FolderNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const fetchNotes = useCallback(async () => {
    if (!userId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedNotes: Note[] = (data || []).map(mapNoteFromDb);
      setNotes(formattedNotes);
      
      // Extract unique tags
      const tags = new Set<string>();
      formattedNotes.forEach((n: Note) => n.tags.forEach((t: string) => tags.add(t)));
      setAvailableTags(Array.from(tags));
      
    } catch (err: any) {
      console.error('Error fetching notes:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchFolders = useCallback(async () => {
    if (!userId) {
      setFolders([]);
      return;
    }

    try {
      const { data: folderData, error: folderError } = await (supabase as any)
        .from('folders')
        .select('*')
        .eq('user_id', userId)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });

      if (folderError) throw folderError;
      const nextFolders: Folder[] = (folderData || []).map(mapFolderFromDb);
      setFolders(nextFolders);

      if (nextFolders.length === 0) {
        setFolderNotes([]);
        return;
      }

      const folderIds = nextFolders.map((f) => f.id);

      const { data: fnData, error: fnError } = await (supabase as any)
        .from('folder_items')
        .select('folder_id, entity_type, entity_id')
        .in('folder_id', folderIds)
        .eq('entity_type', 'note');

      if (fnError) throw fnError;
      setFolderNotes((fnData || []).map((row: any) => ({
        folderId: row.folder_id,
        noteId: row.entity_id,
      })));

    } catch (err: any) {
      console.error('Error fetching folders:', err.message);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    fetchNotes();
    fetchFolders();

    // Subscribe to notes
    const notesChannel = (supabase as any)
      .channel(`notes_user_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${userId}` },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newNote = mapNoteFromDb(payload.new);
            setNotes((prev) => [newNote, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedNote = mapNoteFromDb(payload.new);
            setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
          } else if (payload.eventType === 'DELETE') {
            setNotes((prev) => prev.filter((n) => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscribe to folders
    const foldersChannel = (supabase as any)
      .channel(`folders_user_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'folders', filter: `user_id=eq.${userId}` },
        () => fetchFolders()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'folder_items' },
        () => fetchFolders()
      )
      .subscribe();

    return () => {
      notesChannel.unsubscribe();
      foldersChannel.unsubscribe();
    };
  }, [userId, fetchNotes, fetchFolders]);

  const toggleFavorite = async (noteId: string, currentStatus: boolean) => {
    if (!userId) return;
    try {
      const { error } = await (supabase as any)
        .from('notes')
        .update({ is_favorite: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', noteId)
        .eq('user_id', userId);

      if (error) throw error;
      setNotes(current => current.map(n => n.id === noteId ? { ...n, isFavorite: !currentStatus } : n));
    } catch (err: any) {
      console.error('Error updating favorite status:', err.message);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!userId) return;
    try {
      await (supabase as any)
        .from('folder_items')
        .delete()
        .eq('entity_type', 'note')
        .eq('entity_id', noteId);

      const { error } = await (supabase as any)
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', userId);

      if (error) throw error;
      setNotes(current => current.filter(n => n.id !== noteId));
    } catch (err: any) {
      console.error('Error deleting note:', err.message);
    }
  };

  const createFolder = async (
    name: string,
    options?: { icon?: string; color?: string; parentFolderId?: string | null },
  ) => {
    if (!userId) throw new Error('User not authenticated');
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Folder name is required');

    const now = new Date().toISOString();
    const payload: Record<string, any> = {
      user_id: userId,
      name: trimmed,
      updated_at: now,
      created_at: now,
      ...(options?.icon ? { icon: options.icon } : {}),
      ...(options?.color ? { color: options.color } : {}),
      ...(typeof options?.parentFolderId !== 'undefined'
        ? { parent_folder_id: options.parentFolderId }
        : {}),
    };

    const { data, error } = await (supabase as any)
      .from('folders')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    await fetchFolders();
    return mapFolderFromDb(data);
  };

  const renameFolder = async (folderId: string, name: string) => {
    if (!userId) throw new Error('User not authenticated');
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Folder name is required');

    const { data, error } = await (supabase as any)
      .from('folders')
      .update({
        name: trimmed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', folderId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) throw error;
    await fetchFolders();
    return mapFolderFromDb(data);
  };

  const deleteFolder = async (folderId: string) => {
    if (!userId) throw new Error('User not authenticated');

    await (supabase as any)
      .from('folder_items')
      .delete()
      .eq('folder_id', folderId);

    const { error } = await (supabase as any)
      .from('folders')
      .delete()
      .eq('id', folderId)
      .eq('user_id', userId);

    if (error) throw error;
    await fetchFolders();
  };

  const moveNoteToFolder = async (noteId: string, folderId: string | null) => {
    if (!userId) throw new Error('User not authenticated');

    const { error: removeError } = await (supabase as any)
      .from('folder_items')
      .delete()
      .eq('entity_type', 'note')
      .eq('entity_id', noteId);

    if (removeError) throw removeError;

    if (folderId) {
      const { error: addError } = await (supabase as any)
        .from('folder_items')
        .insert({
          folder_id: folderId,
          entity_type: 'note',
          entity_id: noteId,
        });

      if (addError) throw addError;
    }

    await fetchFolders();
  };

  // Helper to check if a note is in any folder
  const isNoteInFolder = (noteId: string) => {
    return folderNotes.some(fn => fn.noteId === noteId);
  };

  // Helper to get notes for a specific folder
  const getFolderNotes = (folderId: string) => {
    const noteIds = folderNotes.filter(fn => fn.folderId === folderId).map(fn => fn.noteId);
    return notes.filter(n => noteIds.includes(n.id));
  };

  // Helper to get count of notes in folder
  const getFolderNoteCount = (folderId: string) => {
    return folderNotes.filter(fn => fn.folderId === folderId).length;
  };

  const getNoteFolderIds = (noteId: string) => {
    return folderNotes
      .filter((fn) => fn.noteId === noteId)
      .map((fn) => fn.folderId);
  };

  return { 
    notes, 
    folders,
    folderNotes,
    isNoteInFolder,
    getFolderNotes,
    getFolderNoteCount,
    getNoteFolderIds,
    loading, 
    error,
    availableTags,
    refetch: () => { fetchNotes(); fetchFolders(); },
    createFolder,
    renameFolder,
    deleteFolder,
    moveNoteToFolder,
    toggleFavorite,
    deleteNote
  };
}
