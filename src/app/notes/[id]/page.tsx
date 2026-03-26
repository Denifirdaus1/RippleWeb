'use client';

import { useAuth } from '@/features/auth/presentation/hooks/useAuth';
import Image from 'next/image';
import { Check, ChevronLeft, Loader2, MoreVertical, X } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNoteDetails } from '@/features/notes/presentation/hooks/useNoteDetails';
import { useNotes } from '@/features/notes/presentation/hooks/useNotes';
import { RichTextEditor } from '@/features/notes/presentation/components/RichTextEditor';
import { NotePropertiesPanel } from '@/features/notes/presentation/components/NotePropertiesPanel';
import { NotePriority, NoteWorkStatus } from '@/features/notes/domain/entities/note';

export default function NoteEditorPage() {
  const params = useParams();
  const noteId = params.id as string;
  
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const { 
    note, 
    loading: noteLoading, 
    saving, 
    error, 
    saveNote,
    autoSave,
    setLocalNoteState,
    availableTags,
    createTag
  } = useNoteDetails(noteId, user?.id);
  const { folders, getNoteFolderIds, moveNoteToFolder } = useNotes(user?.id);

  const [titleInput, setTitleInput] = useState('');
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [isMoveFolderOpen, setIsMoveFolderOpen] = useState(false);
  const [isMovingFolder, setIsMovingFolder] = useState(false);
  const [moveFolderError, setMoveFolderError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Track save status for UI indicator
  useEffect(() => {
    if (saving) {
      setSaveStatus('saving');
    } else if (error) {
      setSaveStatus('error');
    } else if (saveStatus === 'saving') {
      setSaveStatus('saved');
      const timer = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [saving, error, saveStatus]);

  // Sync loaded title to local input
  useEffect(() => {
    if (note.title !== undefined && titleInput === '' && !noteLoading) {
      setTitleInput(note.title);
    }
  }, [note.title, noteLoading, titleInput]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitleInput(newTitle);
    autoSave(newTitle, note.content);
  };

  const handleContentChange = (json: any) => {
    setLocalNoteState({ content: json });
    autoSave(titleInput, json);
  };

  const handlePropertiesChange = (updates: { 
    priority?: NotePriority; 
    status?: NoteWorkStatus; 
    tags?: string[];
    isFavorite?: boolean;
    description?: string;
    noteDate?: string;
    enabledProperties?: string[];
  }) => {
    setLocalNoteState(updates);
    autoSave(titleInput, note.content, updates);
  };

  // Save and go back (matching Flutter's _saveAndPop)
  const handleBack = useCallback(async () => {
    const title = titleInput.trim();
    const content = note.content;
    
    // If there's a title or content, do a final save before navigating
    if (title || (content && (content.content || content.ops))) {
      await saveNote(title, content, undefined, false);
    }
    
    router.push('/notes');
  }, [titleInput, note.content, saveNote, router]);

  // Toggle favorite
  const handleToggleFavorite = () => {
    const newFav = !note.isFavorite;
    setLocalNoteState({ isFavorite: newFav });
    autoSave(titleInput, note.content, { isFavorite: newFav });
  };

  const activeNoteId = note.id || (noteId !== 'new' ? noteId : '');
  const currentFolderIds = useMemo(
    () => (activeNoteId ? getNoteFolderIds(activeNoteId) : []),
    [activeNoteId, getNoteFolderIds],
  );
  const currentFolderId = currentFolderIds[0] || null;

  const handleMoveFolderTap = () => {
    if (!activeNoteId) {
      setMoveFolderError('Simpan note dulu sebelum dipindahkan ke folder.');
      return;
    }
    setMoveFolderError(null);
    setIsMoveFolderOpen(true);
  };

  const handleMoveToFolder = async (folderId: string | null) => {
    if (!activeNoteId || isMovingFolder) return;
    try {
      setIsMovingFolder(true);
      setMoveFolderError(null);
      await moveNoteToFolder(activeNoteId, folderId);
      setIsMoveFolderOpen(false);
    } catch (error: any) {
      setMoveFolderError(error?.message || 'Failed to move note.');
    } finally {
      setIsMovingFolder(false);
    }
  };

  if (authLoading || !user || noteLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--primary)]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white flex flex-col relative">
      {/* App Bar */}
      <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={handleBack}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center"
          >
            <ChevronLeft size={24} className="text-slate-700" />
          </button>

          {/* Save Status Indicator */}
          {saveStatus === 'saving' && (
             <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
               <Loader2 size={12} className="animate-spin text-slate-500" />
               <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Saving</span>
             </div>
          )}
          {saveStatus === 'saved' && (
             <div className="px-3 py-1 bg-emerald-50 rounded-full">
               <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600">Saved ✓</span>
             </div>
          )}
          {saveStatus === 'error' && (
             <div className="px-3 py-1 bg-red-50 rounded-full">
               <span className="text-[10px] uppercase tracking-wider font-bold text-red-500">Save failed</span>
             </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleMoveFolderTap}
            className={`p-2 rounded-full transition-colors ${currentFolderId ? 'bg-[var(--primary)]/10 hover:bg-[var(--primary)]/15' : 'hover:bg-slate-100'}`}
            title="Move to folder"
          >
            <Image src="/icons/UI/Add Folder.png" alt="Move to folder" width={20} height={20} />
          </button>

          {/* Favorite Toggle */}
          <button 
            onClick={handleToggleFavorite}
            className={`p-2 rounded-full transition-colors ${note.isFavorite ? 'bg-amber-100 hover:bg-amber-200' : 'hover:bg-slate-100'}`}
            title="Add to favorite"
          >
            <Image
              src="/icons/UI/add to Favorite.png"
              alt="Add to favorite"
              width={20}
              height={20}
              className={note.isFavorite ? 'opacity-100' : 'opacity-65'}
            />
          </button>
          
          {/* Properties panel toggle */}
           <button 
            onClick={() => setIsPropertiesOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <MoreVertical size={20} className="text-slate-700" />
          </button>
        </div>
      </header>

      {/* Editor Content Area */}
      <div className="flex-1 w-full max-w-3xl mx-auto px-6 py-6 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
         {/* Title Input */}
         <input 
          type="text"
          placeholder="Judul Catatan..."
          value={titleInput}
          onChange={handleTitleChange}
          className="text-3xl sm:text-4xl font-balsamiq font-bold text-slate-800 placeholder:text-slate-300 outline-none w-full mb-6 bg-transparent"
         />

         {/* Rich Text Editor */}
         <div className="flex-1 w-full overflow-hidden flex flex-col">
             <RichTextEditor 
              key={note.id || noteId}
              initialContent={note.content} 
              onChange={handleContentChange}
              userId={user.id}
            />
         </div>
      </div>

      <NotePropertiesPanel 
        isOpen={isPropertiesOpen}
        onClose={() => setIsPropertiesOpen(false)}
        enabledProperties={note.enabledProperties || ['date']}
        noteDate={note.noteDate}
        priority={note.priority}
        status={note.status}
        tags={note.tags || []}
        isFavorite={note.isFavorite || false}
        description={note.description || ''}
        availableTags={availableTags}
        onChange={handlePropertiesChange}
        onTagCreated={createTag}
      />

      {moveFolderError && (
        <div className="fixed bottom-4 left-1/2 z-[65] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 shadow-lg">
          {moveFolderError}
        </div>
      )}

      {isMoveFolderOpen && (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/35"
            onClick={() => setIsMoveFolderOpen(false)}
            aria-label="Close move folder"
          />
          <div className="absolute left-1/2 bottom-4 w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2">
            <div className="mb-2 flex items-center justify-between px-2 py-1">
              <div>
                <p className="text-base font-semibold text-slate-900">Move to Folder</p>
                <p className="text-xs text-slate-500">Pilih folder tujuan untuk note ini.</p>
              </div>
              <button
                type="button"
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                onClick={() => setIsMoveFolderOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-2 max-h-[45vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => void handleMoveToFolder(null)}
                disabled={isMovingFolder}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  currentFolderId === null ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                  <Image src="/icons/UI/Add Folder.png" alt="Inbox" width={16} height={16} />
                </span>
                <span className="flex-1 text-sm font-medium">Inbox (No Folder)</span>
                {currentFolderId === null && <Check size={16} />}
              </button>

              <div className="my-2 border-t border-slate-100" />

              {folders.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-slate-500">No folders yet.</div>
              ) : (
                folders.map((folder) => {
                  const selected = folder.id === currentFolderId;
                  return (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => void handleMoveToFolder(folder.id)}
                      disabled={isMovingFolder}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        selected ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                        <Image src="/icons/UI/Folder NBG.png" alt="Folder" width={16} height={16} />
                      </span>
                      <span className="flex-1 truncate text-sm font-medium">{folder.name}</span>
                      {selected && <Check size={16} />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
