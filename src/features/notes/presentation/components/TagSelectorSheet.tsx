'use client';

import React, { useState, useMemo } from 'react';
import { X, Search, Plus, Check } from 'lucide-react';

export interface NoteTag {
  id: string;
  name: string;
  colorHex: string;
}

const DEFAULT_TAGS: NoteTag[] = [
  { id: 'default_idea', name: 'Idea', colorHex: '#4A5568' },
  { id: 'default_note', name: 'Note', colorHex: '#D69E2E' },
  { id: 'default_reminder', name: 'Reminder', colorHex: '#C53030' },
];

const PRESET_COLORS = [
  '#4A5568', '#D69E2E', '#C53030', '#2B6CB0', 
  '#38A169', '#805AD5', '#DD6B20', '#319795'
];

interface TagSelectorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTags: string[];
  availableTags: NoteTag[];
  onTagSelected: (name: string) => void;
  onTagRemoved: (name: string) => void;
  onTagCreated: (name: string, colorHex: string) => void;
}

export const TagSelectorSheet: React.FC<TagSelectorSheetProps> = ({
  isOpen, onClose, selectedTags, availableTags, onTagSelected, onTagRemoved, onTagCreated
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewNameColor] = useState(PRESET_COLORS[0]);

  const filteredTags = useMemo(() => {
    const all = [...DEFAULT_TAGS, ...availableTags];
    const unique = all.filter((tag, index, self) => 
      index === self.findIndex((t) => t.name === tag.name)
    );
    
    if (!searchQuery) return unique;
    return unique.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [availableTags, searchQuery]);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!newName.trim()) return;
    onTagCreated(newName.trim(), newColor);
    onTagSelected(newName.trim());
    setNewName('');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-balsamiq font-bold text-xl text-slate-800">Add Tags</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Search */}
          {!isCreating && (
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text"
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3.5 text-slate-700 outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
              />
            </div>
          )}

          {/* Tag List */}
          {!isCreating && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">All Tags</h4>
              <div className="flex flex-wrap gap-3">
                {filteredTags.map(tag => {
                  const isSelected = selectedTags.includes(tag.name);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => isSelected ? onTagRemoved(tag.name) : onTagSelected(tag.name)}
                      className="px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2 group"
                      style={{ 
                        backgroundColor: isSelected ? `${tag.colorHex}22` : `${tag.colorHex}11`,
                        borderColor: isSelected ? tag.colorHex : 'transparent'
                      }}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.colorHex }} />
                      <span className="text-sm font-bold text-slate-700">{tag.name}</span>
                      {isSelected && <Check size={14} style={{ color: tag.colorHex }} />}
                    </button>
                  );
                })}
                {filteredTags.length === 0 && (
                  <p className="text-slate-400 italic text-sm py-4">No tags found.</p>
                )}
              </div>
            </div>
          )}

          {/* Create Form */}
          {isCreating ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800">Create New Tag</h4>
                <button onClick={() => setIsCreating(false)} className="text-sm text-[var(--primary)] font-bold">Cancel</button>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Tag Name</label>
                <input 
                  autoFocus
                  type="text"
                  placeholder="e.g. Design UI"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-slate-700 font-bold outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase">Choose Color</label>
                <div className="flex flex-wrap gap-3">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewNameColor(color)}
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all border-2"
                      style={{ 
                        backgroundColor: `${color}22`,
                        borderColor: newColor === color ? '[var(--primary)]' : 'transparent'
                      }}
                    >
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="w-full py-4 bg-[var(--primary)] text-white rounded-2xl font-bold shadow-lg shadow-[var(--primary)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
              >
                Create Tag
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold flex items-center justify-center gap-2 hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all"
            >
              <Plus size={20} />
              <span>Create New Tag</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
