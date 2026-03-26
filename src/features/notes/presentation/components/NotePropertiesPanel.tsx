'use client';

import React, { useState } from 'react';
import { 
  X, Tag, Circle, CheckCircle2, Clock, 
  Star, FileText, Calendar, Plus, 
  ChevronRight, AlertCircle, Info, BarChart3
} from 'lucide-react';
import { NotePriority, NoteWorkStatus } from '../../domain/entities/note';
import { TagSelectorSheet, NoteTag } from './TagSelectorSheet';

const AVAILABLE_PROPERTIES = [
  { id: 'date', label: 'Date', icon: <Calendar size={18} /> },
  { id: 'tags', label: 'Tags', icon: <Tag size={18} /> },
  { id: 'priority', label: 'Priority', icon: <BarChart3 size={18} /> },
  { id: 'status', label: 'Status', icon: <Info size={18} /> },
  { id: 'description', label: 'Description', icon: <FileText size={18} /> },
];

interface NotePropertiesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  enabledProperties: string[];
  noteDate?: string;
  priority?: NotePriority;
  status?: NoteWorkStatus;
  tags: string[];
  isFavorite: boolean;
  description: string;
  availableTags?: NoteTag[];
  onChange: (updates: { 
    priority?: NotePriority; 
    status?: NoteWorkStatus; 
    tags?: string[];
    isFavorite?: boolean;
    description?: string;
    noteDate?: string;
    enabledProperties?: string[];
  }) => void;
  onTagCreated: (name: string, colorHex: string) => void;
}

export const NotePropertiesPanel: React.FC<NotePropertiesPanelProps> = ({
  isOpen, onClose, enabledProperties, noteDate, priority, status, 
  tags, isFavorite, description, availableTags = [], onChange, onTagCreated
}) => {
  const [descInput, setDescInput] = useState(description);
  const [isTagSheetOpen, setIsTagSheetOpen] = useState(false);
  const [isAddPropOpen, setIsAddPropOpen] = useState(false);

  // Sync descInput when description prop changes
  React.useEffect(() => {
    setDescInput(description);
  }, [description]);

  if (!isOpen) return null;

  const handleToggleProperty = (propId: string) => {
    if (propId === 'date') return; // Date is usually mandatory in Android
    if (enabledProperties.includes(propId)) {
      onChange({ enabledProperties: enabledProperties.filter(id => id !== propId) });
    } else {
      onChange({ enabledProperties: [...enabledProperties, propId] });
    }
  };

  const handleDescriptionBlur = () => {
    if (descInput !== description) {
      onChange({ description: descInput });
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-sm w-full bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-balsamiq font-bold text-xl text-slate-800">Properties</h3>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 no-scrollbar">

          {/* Favorite Toggle (Global) */}
          <section>
            <button
              onClick={() => onChange({ isFavorite: !isFavorite })}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition-all ${
                isFavorite 
                  ? 'border-amber-400 bg-amber-50 shadow-sm' 
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Star size={18} className={isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-400'} />
              <span className={`text-sm font-bold ${isFavorite ? 'text-amber-700' : 'text-slate-600'}`}>
                {isFavorite ? 'Favorited' : 'Add to Favorites'}
              </span>
            </button>
          </section>

          {/* Sandbox Style Properties */}
          <div className="space-y-6">
            {/* Date Property */}
            {enabledProperties.includes('date') && (
              <PropertyRow 
                label="Date" 
                icon={<Calendar size={18} className="text-blue-500" />}
                onClick={() => {}} // Could trigger a custom date picker
              >
                <input 
                  type="date" 
                  value={noteDate || ''} 
                  onChange={(e) => onChange({ noteDate: e.target.value })}
                  className="bg-transparent border-none text-sm font-bold text-slate-700 outline-none cursor-pointer"
                />
              </PropertyRow>
            )}

            {/* Tags Property */}
            {enabledProperties.includes('tags') && (
              <PropertyRow 
                label="Tags" 
                icon={<Tag size={18} className="text-purple-500" />}
                onClick={() => setIsTagSheetOpen(true)}
              >
                <div className="flex flex-wrap gap-1.5">
                  {tags.length > 0 ? (
                    tags.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-md">#{t}</span>
                    ))
                  ) : (
                    <span className="text-slate-300 text-sm italic">Empty</span>
                  )}
                </div>
              </PropertyRow>
            )}

            {/* Priority Property */}
            {enabledProperties.includes('priority') && (
              <PropertyRow 
                label="Priority" 
                icon={<BarChart3 size={18} className="text-orange-500" />}
              >
                <div className="flex gap-1.5">
                  {[NotePriority.low, NotePriority.medium, NotePriority.high].map(p => (
                    <button
                      key={p}
                      onClick={() => onChange({ priority: p })}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                        priority === p 
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)]' 
                          : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200'
                      }`}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </PropertyRow>
            )}

            {/* Status Property */}
            {enabledProperties.includes('status') && (
              <PropertyRow 
                label="Status" 
                icon={<Info size={18} className="text-emerald-500" />}
              >
                <select 
                  value={status || ''} 
                  onChange={(e) => onChange({ status: e.target.value as NoteWorkStatus })}
                  className="bg-transparent border-none text-sm font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="">Select Status</option>
                  <option value={NoteWorkStatus.notStarted}>Not Started</option>
                  <option value={NoteWorkStatus.inProgress}>In Progress</option>
                  <option value={NoteWorkStatus.done}>Done</option>
                </select>
              </PropertyRow>
            )}

            {/* Description Property */}
            {enabledProperties.includes('description') && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <FileText size={18} />
                  <span className="text-xs font-bold uppercase tracking-widest">Description</span>
                </div>
                <textarea
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  onBlur={handleDescriptionBlur}
                  placeholder="Add a description..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/10 transition-all text-slate-700 placeholder:text-slate-300 resize-none font-medium"
                />
              </div>
            )}
          </div>

          {/* Add Property Button */}
          <div className="pt-4 border-t border-slate-50 relative">
            <button
              onClick={() => setIsAddPropOpen(!isAddPropOpen)}
              className="flex items-center gap-3 text-[var(--primary)] font-bold text-sm px-2 py-2 hover:bg-[var(--primary)]/5 rounded-xl transition-all w-full"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                <Plus size={18} />
              </div>
              <span>Add Property</span>
            </button>

            {isAddPropOpen && (
              <div className="absolute bottom-full left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-xl p-2 mb-2 z-10 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {AVAILABLE_PROPERTIES.map(prop => {
                  const isEnabled = enabledProperties.includes(prop.id);
                  return (
                    <button
                      key={prop.id}
                      onClick={() => handleToggleProperty(prop.id)}
                      className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-slate-400">{prop.icon}</div>
                        <span className="text-sm font-bold text-slate-700">{prop.label}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isEnabled ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-slate-200'}`}>
                        {isEnabled && <Check size={12} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Tag Selector Modal */}
      <TagSelectorSheet 
        isOpen={isTagSheetOpen}
        onClose={() => setIsTagSheetOpen(false)}
        selectedTags={tags}
        availableTags={availableTags}
        onTagSelected={(name) => onChange({ tags: [...tags, name] })}
        onTagRemoved={(name) => onChange({ tags: tags.filter(t => t !== name) })}
        onTagCreated={onTagCreated}
      />
    </>
  );
};

const PropertyRow: React.FC<{ 
  label: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ label, icon, children, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center justify-between py-1 px-2 rounded-xl transition-colors ${onClick ? 'hover:bg-slate-50 cursor-pointer' : ''}`}
  >
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
        {icon}
      </div>
      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest text-[10px]">{label}</span>
    </div>
    <div className="flex-1 flex justify-end min-w-0 ml-4">
      {children}
    </div>
    {onClick && <ChevronRight size={16} className="text-slate-300 ml-2" />}
  </div>
);

const Check: React.FC<{ size: number; className?: string }> = ({ size, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
