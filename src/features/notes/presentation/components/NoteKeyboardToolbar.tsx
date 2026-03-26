'use client';

import React, { useCallback } from 'react';
import type { Editor } from '@tiptap/core';
import { BubbleMenu } from '@tiptap/react/menus';
import { Image as ImageIcon, Link2, Loader2, Sparkles, Strikethrough, Underline as UnderlineIcon } from 'lucide-react';

interface NoteKeyboardToolbarProps {
  editor: Editor | null;
  onAiTap?: () => void;
  onImageTap?: () => void;
  isImageUploading?: boolean;
  isAiLoading?: boolean;
}

export const NoteKeyboardToolbar: React.FC<NoteKeyboardToolbarProps> = ({
  editor,
  onAiTap,
  onImageTap,
  isImageUploading = false,
  isAiLoading = false,
}) => {
  const handleLinkTap = useCallback(() => {
    if (!editor) return;

    if (editor.isActive('link')) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    const currentHref = editor.getAttributes('link')?.href || '';
    const url = window.prompt('Masukkan URL', currentHref || 'https://');
    if (url === null) return;

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: trimmedUrl }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: instance, state, from, to }) => {
        if (!instance.isEditable) return false;
        if (state.selection.empty) return false;
        const selectedText = state.doc.textBetween(from, to, ' ').trim();
        return selectedText.length > 0;
      }}
      options={{
        placement: 'top',
        offset: { mainAxis: 12 },
        shift: { padding: 8 },
      }}
    >
      <div className="flex items-center gap-1 rounded-2xl border border-white/15 bg-[#1f1f23]/95 px-2 py-2 shadow-2xl backdrop-blur-md">
        <ToolbarButton
          label="B"
          isActive={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="I"
          isActive={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          icon={<UnderlineIcon size={16} />}
          isActive={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton
          icon={<Strikethrough size={16} />}
          isActive={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
        <ToolbarButton
          label="</>"
          isActive={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
        />

        <div className="mx-1 h-6 w-px bg-white/15" />

        <ToolbarButton
          icon={<Link2 size={16} />}
          isActive={editor.isActive('link')}
          onClick={handleLinkTap}
        />
        <ToolbarButton
          icon={isImageUploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
          onClick={isImageUploading ? undefined : onImageTap}
          isDisabled={isImageUploading && !onImageTap}
        />
        <ToolbarButton
          icon={isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          onClick={isAiLoading ? undefined : onAiTap}
          isDisabled={isAiLoading}
        />
      </div>
    </BubbleMenu>
  );
};

interface ToolbarButtonProps {
  icon?: React.ReactNode;
  label?: string;
  isActive?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  label,
  isActive = false,
  isDisabled = false,
  onClick,
}) => {
  const disabled = isDisabled || !onClick;
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (disabled) return;
        onClick?.();
      }}
      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors ${
        isActive
          ? 'bg-white/20 text-white'
          : 'text-slate-100 hover:bg-white/10 hover:text-white'
      } ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
      aria-disabled={disabled}
    >
      {icon || label}
    </button>
  );
};
