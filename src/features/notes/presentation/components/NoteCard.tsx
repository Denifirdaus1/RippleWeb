import React from 'react';
import Image from 'next/image';
import { Note, NotePriority, NoteWorkStatus } from '../../domain/entities/note';

interface NoteCardProps {
  note: Note;
  onTap: () => void;
  availableTags?: string[];
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onTap, availableTags = [] }) => {
  // Determine Base Color based on Priority
  let baseColor = 'var(--primary)'; // Default Ripple Blue (#9C5FEC)
  let borderColor = 'border-[var(--primary)]';
  
  switch (note.priority) {
    case NotePriority.high:
      baseColor = '#FFB74D';
      borderColor = 'border-[#FFB74D]';
      break;
    case NotePriority.medium:
      baseColor = '#B4D8F6';
      borderColor = 'border-[#B4D8F6]';
      break;
    case NotePriority.low:
      baseColor = '#AED581';
      borderColor = 'border-[#AED581]';
      break;
  }

  const priorityIcon = (() => {
    switch (note.priority) {
      case NotePriority.high: return '/icons/Priority/high NBG.png';
      case NotePriority.medium: return '/icons/Priority/mediumNBG.png';
      case NotePriority.low: return '/icons/Priority/low NGB.png';
      default: return null;
    }
  })();

  const statusIcon = (() => {
    switch (note.status) {
      case NoteWorkStatus.notStarted: return '/icons/Status/Not started.png';
      case NoteWorkStatus.inProgress: return '/icons/Status/In Progress.png';
      case NoteWorkStatus.done: return '/icons/Status/Done.png';
      default: return null;
    }
  })();

  const firstTag = note.tags && note.tags.length > 0 ? `#${note.tags[0]}` : null;

  // Time formatter matching Dart's _formatTime matching Flutter
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div 
      onClick={onTap}
      className={`p-5 bg-white rounded-3xl border-2 ${borderColor} cursor-pointer hover:shadow-lg transition-all duration-200 ripple-card relative group w-full`}
    >
      {/* Header: Title & Time */}
      <div className="flex justify-between items-start gap-3 w-full">
        <h3 
          className="font-balsamiq text-lg font-bold truncate flex-1"
          style={{ color: baseColor }}
        >
          {note.title || 'Tanpa Judul'}
        </h3>
        <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap pt-1">
          {formatTime(note.createdAt)}
        </span>
      </div>

      <div className="h-3" /> {/* Spacer */}

      {/* Content Snippet */}
      <p className="text-[13px] text-slate-700/80 leading-relaxed line-clamp-2">
        {note.description || 'No description for this note...'}
      </p>

      <div className="h-4" /> {/* Spacer */}

      {/* Footer: Tag Pill + Priority Icon + Status Icon */}
      {(firstTag || priorityIcon || statusIcon) && (
        <div className="flex items-center gap-3 w-full flex-wrap">
          {/* Tag Pill */}
          {firstTag && (
            <div 
              className="px-4 py-1.5 rounded-full"
              style={{ backgroundColor: `${baseColor}33` }} // 33 is hex for ~20% opacity
            >
              <span 
                className="text-xs font-medium"
                style={{ color: baseColor }} // Opaque color for text
              >
                {firstTag}
              </span>
            </div>
          )}

          {/* Priority Icon Bubble */}
          {priorityIcon && (
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${baseColor}33` }}
            >
              <div className="relative w-5 h-5">
                <Image src={priorityIcon} alt="Priority" fill className="object-contain" />
              </div>
            </div>
          )}

          {/* Status Icon Bubble */}
          {statusIcon && (
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 shrink-0">
               <div className="relative w-5 h-5">
                <Image src={statusIcon} alt="Status" fill className="object-contain" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
