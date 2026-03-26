'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { NoteCard } from './NoteCard';
import { Folder } from '../../domain/entities/folder';
import { Note } from '../../domain/entities/note';

interface NotesListProps {
  notes: Note[];
  folders: Folder[];
  isNoteInFolder: (noteId: string) => boolean;
  getFolderNoteCount: (folderId: string) => number;
  loading: boolean;
  error: string | null;
  availableTags: string[];
}

export const NotesList: React.FC<NotesListProps> = ({
  notes,
  folders,
  isNoteInFolder,
  getFolderNoteCount,
  loading,
  error,
  availableTags,
}) => {
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex-1 flex justify-center py-20">     
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="relative w-48 h-48 mb-6 opacity-90 drop-shadow-xl grayscale">
          <Image
            src="/images/mascot/Ripple%20nap.png"
            alt="Error loading notes"
            fill
            className="object-contain"
          />
        </div>
        <h3 className="text-xl font-bold text-slate-700 mb-2">Oops, something went wrong</h3>
        <p className="text-slate-500 max-w-sm mb-4">
          Failed to load your notes due to an error.
        </p>
        <div className="bg-red-50 text-red-500 px-4 py-2 rounded-lg text-sm max-w-lg mt-2">
           {error}
        </div>
      </div>
    );
  }

  // Filter out notes that are in folders (matches Android logic)
  const standaloneNotes = notes.filter(n => !isNoteInFolder(n.id));

  if (folders.length === 0 && standaloneNotes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="relative w-48 h-48 mb-6 opacity-90 drop-shadow-xl">
          <Image
            src="/images/mascot/Ripple%20nap.png"
            alt="Mascot napping"
            fill
            className="object-contain"
          />
        </div>
        <h3 className="text-xl font-bold text-slate-700 mb-2">No notes yet</h3>
        <p className="text-slate-500 max-w-sm">
          Capture your ideas and tasks. Your notes will appear here.
        </p>
      </div>
    );
  }

  // Sort standalone notes: favorites first, then by createdAt desc     
  const sortedNotes = [...standaloneNotes].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="w-full space-y-10">
      {/* Folders Section */}
      {folders.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6 px-1">    
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
              Folders
            </h2>
            <div className="bg-slate-100 px-3 py-0.5 rounded-full text-xs font-bold text-slate-500">
              {folders.length}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {folders.map((folder) => (
              <FolderCard 
                key={folder.id} 
                folder={folder} 
                noteCount={getFolderNoteCount(folder.id)}
                onClick={() => router.push(`/notes/folder/${folder.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Standalone Notes Section */}
      <section>
        <div className="flex items-center gap-3 mb-6 px-1">    
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
            Notes
          </h2>
          <div className="bg-slate-100 px-3 py-0.5 rounded-full text-xs font-bold text-slate-500">
            {sortedNotes.length}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              availableTags={availableTags}
              onTap={() => router.push(`/notes/${note.id}`)}   
            />
          ))}
        </div>
      </section>
    </div>
  );
};

const FolderCard: React.FC<{ 
  folder: Folder; 
  noteCount: number;
  onClick: () => void;
}> = ({ folder, noteCount, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-[var(--primary)] hover:shadow-md transition-all cursor-pointer flex items-center gap-4 group"
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-[var(--primary)]/10 transition-colors">
        <Image 
          src={folder.iconPath || '/icons/UI/Folder NBG.png'} 
          alt="Folder" 
          width={24} 
          height={24} 
          className="opacity-70 group-hover:opacity-100 transition-opacity"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-slate-800 truncate">{folder.name}</h4>
        <p className="text-xs text-slate-500">{noteCount} notes</p>
      </div>
    </div>
  );
};
