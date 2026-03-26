'use client';

import { useAuth } from '@/features/auth/presentation/hooks/useAuth';
import { NotesList } from '@/features/notes/presentation/components/NotesList';
import { useNotes } from '@/features/notes/presentation/hooks/useNotes';
import Image from 'next/image';
import { Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

export default function NotesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderBusy, setFolderBusy] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);

  const {
    notes,
    folders,
    isNoteInFolder,
    getFolderNoteCount,
    loading: notesLoading,
    error: notesError,
    availableTags,
    createFolder,
  } = useNotes(user?.id);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!isCreateFolderOpen) {
      setFolderName('');
      setFolderError(null);
      setFolderBusy(false);
    }
  }, [isCreateFolderOpen]);

  const canSubmitFolder = useMemo(() => folderName.trim().length > 0 && !folderBusy, [folderName, folderBusy]);

  const handleCreateFolder = async () => {
    const trimmed = folderName.trim();
    if (!trimmed || folderBusy) return;
    try {
      setFolderBusy(true);
      setFolderError(null);
      await createFolder(trimmed);
      setIsCreateFolderOpen(false);
    } catch (error: any) {
      setFolderError(error?.message || 'Failed to create folder');
    } finally {
      setFolderBusy(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
           <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--primary)] shadow-xl" />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24 relative flex flex-col">
      {/* Header aligned with Todo Page (RipplePageHeader style) */}
      <header className="sticky top-0 z-30 w-full bg-white/70 backdrop-blur-xl border-b border-slate-100 flex items-center h-20 px-8">
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notes</h1>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setIsCreateFolderOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white transition-colors hover:bg-slate-50"
            title="Add Folder"
          >
            <Image src="/icons/UI/Add Folder.png" alt="Add Folder" width={22} height={22} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-6 lg:px-12 py-10 flex flex-col">
        <NotesList
          notes={notes}
          folders={folders}
          isNoteInFolder={isNoteInFolder}
          getFolderNoteCount={getFolderNoteCount}
          loading={notesLoading}
          error={notesError}
          availableTags={availableTags}
        />
      </div>

      {/* Floating Action Button (FAB) */}
      <Link 
        href="/notes/new"
        className="fixed bottom-10 right-10 w-16 h-16 bg-[var(--primary)] rounded-full flex items-center justify-center shadow-2xl shadow-[var(--primary-glow)] hover:scale-105 transition-transform text-white group z-50"
      >
        <Plus size={32} className="group-hover:rotate-90 transition-transform duration-300" />
      </Link>

      {isCreateFolderOpen && (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/35"
            onClick={() => setIsCreateFolderOpen(false)}
            aria-label="Close create folder"
          />
          <div className="absolute left-1/2 bottom-4 w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <Image src="/icons/UI/Folder NBG.png" alt="Folder" width={22} height={22} />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">Create New Folder</p>
                  <p className="text-xs text-slate-500">Pisahkan catatan biar lebih rapi.</p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                onClick={() => setIsCreateFolderOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <input
              type="text"
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && canSubmitFolder) {
                  event.preventDefault();
                  void handleCreateFolder();
                }
              }}
              autoFocus
              placeholder="Folder name..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-[var(--primary)]"
            />

            {folderError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                {folderError}
              </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreateFolderOpen(false)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleCreateFolder()}
                disabled={!canSubmitFolder}
                className="rounded-lg bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-55"
              >
                {folderBusy ? 'Creating...' : 'Create Folder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
