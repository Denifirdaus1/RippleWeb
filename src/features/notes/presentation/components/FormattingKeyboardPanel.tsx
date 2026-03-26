'use client';

import React from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  CheckSquare,
  Outdent,
  Indent
} from 'lucide-react';
import { Editor } from '@tiptap/react';

interface FormattingKeyboardPanelProps {
  editor: Editor;
  height?: number;
}

export const FormattingKeyboardPanel: React.FC<FormattingKeyboardPanelProps> = ({
  editor,
  height = 300,
}) => {
  if (!editor) return null;

  return (
    <div 
      className="bg-white p-6 border-t border-slate-200 overflow-y-auto"
      style={{ height }}
    >
      <div className="max-w-xl mx-auto space-y-8">
        {/* Headers Section */}
        <section>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <HeaderButton 
              label="H1" 
              active={editor.isActive('heading', { level: 1 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            />
            <HeaderButton 
              label="H2" 
              active={editor.isActive('heading', { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            />
            <HeaderButton 
              label="H3" 
              active={editor.isActive('heading', { level: 3 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            />
            <HeaderButton 
              label="Body" 
              active={!editor.isActive('heading')}
              onClick={() => editor.chain().focus().setParagraph().run()}
            />
          </div>
        </section>

        <div className="h-px bg-slate-100" />

        {/* Basic Styles & Alignment */}
        <section className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            <StyleButton 
              icon={<Bold size={20} />} 
              active={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
            />
            <StyleButton 
              icon={<Italic size={20} />} 
              active={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            />
            <StyleButton 
              icon={<Underline size={20} />} 
              active={editor.isActive('underline')}
              onClick={() => editor.chain().focus().toggleUnderline?.().run()}
            />
            <StyleButton 
              icon={<Strikethrough size={20} />} 
              active={editor.isActive('strike')}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            />
          </div>

          <div className="w-px h-6 bg-slate-200 mx-2" />

          <div className="flex gap-1">
            <StyleButton 
              icon={<AlignLeft size={20} />} 
              active={editor.isActive({ textAlign: 'left' })}
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
            />
            <StyleButton 
              icon={<AlignCenter size={20} />} 
              active={editor.isActive({ textAlign: 'center' })}
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
            />
            <StyleButton 
              icon={<AlignRight size={20} />} 
              active={editor.isActive({ textAlign: 'right' })}
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
            />
          </div>
        </section>

        {/* Lists & Indentation */}
        <section className="flex flex-wrap items-center gap-4">
          <div className="flex gap-3">
            <ListButton 
              icon={<List size={22} />} 
              active={editor.isActive('bulletList')}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            />
            <ListButton 
              icon={<ListOrdered size={22} />} 
              active={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            />
            <ListButton 
              icon={<CheckSquare size={22} />} 
              active={editor.isActive('taskList')}
              onClick={() => editor.chain().focus().toggleTaskList?.().run()}
            />
          </div>

          <div className="flex gap-2 ml-auto">
            <button 
              onClick={() => {
                if (editor.isActive('taskList')) {
                  editor.chain().focus().liftListItem('taskItem').run();
                  return;
                }
                editor.chain().focus().liftListItem('listItem').run();
              }}
              className="p-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100"
            >
              <Outdent size={20} />
            </button>
            <button 
              onClick={() => {
                if (editor.isActive('taskList')) {
                  editor.chain().focus().sinkListItem('taskItem').run();
                  return;
                }
                editor.chain().focus().sinkListItem('listItem').run();
              }}
              className="p-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100"
            >
              <Indent size={20} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

const HeaderButton: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button
    onClick={(e) => { e.preventDefault(); onClick(); }}
    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
      active 
        ? 'bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20' 
        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
    }`}
  >
    {label}
  </button>
);

const StyleButton: React.FC<{ icon: React.ReactNode; active: boolean; onClick: () => void }> = ({ icon, active, onClick }) => (
  <button
    onClick={(e) => { e.preventDefault(); onClick(); }}
    className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
      active 
        ? 'bg-[var(--primary)]/10 text-[var(--primary)]' 
        : 'text-slate-600 hover:bg-slate-50'
    }`}
  >
    {icon}
  </button>
);

const ListButton: React.FC<{ icon: React.ReactNode; active: boolean; onClick: () => void }> = ({ icon, active, onClick }) => (
  <button
    onClick={(e) => { e.preventDefault(); onClick(); }}
    className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all ${
      active 
        ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20' 
        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
    }`}
  >
    {icon}
  </button>
);
