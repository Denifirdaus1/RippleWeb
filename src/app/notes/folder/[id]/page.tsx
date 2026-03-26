'use client';

import { useAuth } from '@/features/auth/presentation/hooks/useAuth';
import { NoteCard } from '@/features/notes/presentation/components/NoteCard';
import { useNotes } from '@/features/notes/presentation/hooks/useNotes';
import { ChevronLeft, FolderOpen, Loader2, MoreHorizontal, PencilLine, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function FolderDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const folderId = params.id as string;

  const {
    folders,
    getFolderNotes,
    availableTags,
    renameFolder,
    deleteFolder,
    loading,
  } = useNotes(user?.id);

  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const [renameBusy, setRenameBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, router, user]);

  const folder = useMemo(() => folders.find((item) => item.id === folderId), [folders, folderId]);

  const notes = useMemo(() => {
    const folderNotes = getFolderNotes(folderId);
    return [...folderNotes].sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [getFolderNotes, folderId]);

  const openRename = () => {
    if (!folder) return;
    setRenameInput(folder.name);
    setActionError(null);
    setIsRenameOpen(true);
    setIsOptionsOpen(false);
  };

  const handleRename = async () => {
    if (!folder || renameBusy) return;
    const trimmed = renameInput.trim();
    if (!trimmed) {
      setActionError('Folder name is required');
      return;
    }

    try {
      setRenameBusy(true);
      setActionError(null);
      await renameFolder(folder.id, trimmed);
      setIsRenameOpen(false);
    } catch (error: any) {
      setActionError(error?.message || 'Failed to rename folder');
    } finally {
      setRenameBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!folder || deleteBusy) return;
    const confirmed = window.confirm(
      'Delete this folder?\n\nNotes inside will not be deleted, they will move back to inbox.',
    );
    if (!confirmed) return;

    try {
      setDeleteBusy(true);
      setActionError(null);
      await deleteFolder(folder.id);
      router.push('/notes');
    } catch (error: any) {
      setActionError(error?.message || 'Failed to delete folder');
    } finally {
      setDeleteBusy(false);
      setIsOptionsOpen(false);
    }
  };

  if (authLoading || !user || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--primary)]" />
      </div>
    );
  }

  if (!folder) {
    return (
      <main className="min-h-screen bg-[#F8FAFC]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-slate-100 bg-white/90 px-4 backdrop-blur-md">
          <button
            type="button"
            onClick={() => router.push('/notes')}
            className="rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-base font-semibold text-slate-800">Folder tidak ditemukan</h1>
        </header>
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
          <FolderOpen size={54} className="text-slate-300" />
          <p className="mt-5 text-base font-semibold text-slate-700">Folder tidak ditemukan atau sudah dihapus.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] relative">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-100 bg-white/90 px-4 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/notes')}
            className="rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
            <Image
              src={folder.iconPath || '/icons/UI/Folder NBG.png'}
              alt="Folder"
              width={18}
              height={18}
            />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-slate-900">{folder.name}</h1>
            <p className="text-xs text-slate-500">{notes.length} notes</p>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOptionsOpen((prev) => !prev)}
            className="rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100"
          >
            <MoreHorizontal size={20} />
          </button>

          {isOptionsOpen && (
            <div className="absolute right-0 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
              <button
                type="button"
                onClick={openRename}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <PencilLine size={15} />
                <span>Rename</span>
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleteBusy}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                {deleteBusy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                <span>Delete Folder</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-8">
        {actionError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
            {actionError}
          </div>
        )}

        {notes.length === 0 ? (
          <div className="mx-auto mt-24 max-w-md text-center">
            <FolderOpen size={58} className="mx-auto text-slate-300" />
            <p className="mt-5 text-lg font-semibold text-slate-700">Folder kosong</p>
            <p className="mt-1 text-sm text-slate-500">
              Pindahkan notes ke folder ini dari halaman editor note.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                availableTags={availableTags}
                onTap={() => router.push(`/notes/${note.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {isRenameOpen && (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/35"
            onClick={() => setIsRenameOpen(false)}
            aria-label="Close rename modal"
          />
          <div className="absolute left-1/2 top-1/2 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-base font-semibold text-slate-900">Rename Folder</p>
              <button
                type="button"
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                onClick={() => setIsRenameOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <input
              type="text"
              value={renameInput}
              onChange={(event) => setRenameInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void handleRename();
                }
              }}
              autoFocus
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[var(--primary)]"
              placeholder="Folder name..."
            />
            {actionError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                {actionError}
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRenameOpen(false)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleRename()}
                disabled={renameBusy}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {renameBusy && <Loader2 size={14} className="animate-spin" />}
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

