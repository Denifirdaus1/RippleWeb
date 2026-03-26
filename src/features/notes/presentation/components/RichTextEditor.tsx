'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
import { AlignCenter, AlignLeft, AlignRight, Code2, GripVertical, Loader2, NotebookPen, Plus, SquareCheckBig, Type, Trash2 } from 'lucide-react';
import { marked } from 'marked';
import { DragHandle } from '@tiptap/extension-drag-handle-react';
import { offset } from '@floating-ui/dom';
import { supabase } from '@/core/utils/supabase';
import { NoteKeyboardToolbar } from './NoteKeyboardToolbar';
import {
  RIPPLE_CALLOUT_NODE,
  RIPPLE_EMBED_NODE,
  RIPPLE_IMAGE_NODE,
  RIPPLE_SHARED_LINK_NODE,
  deltaToTipTapDoc,
  normalizeToDelta,
  tipTapDocToDelta,
} from '../utils/deltaContent';

interface RichTextEditorProps {
  initialContent: any; // Delta JSON { ops: [] } (Android parity)
  onChange: (json: any) => void;
  editable?: boolean;
  userId?: string;
}

type ImageAlignment = 'left' | 'center' | 'right';

interface ParsedImageStyle {
  width: number | null;
  alignment: ImageAlignment;
}

interface SelectedImageState {
  pos: number;
  src: string;
  width: number;
  alignment: ImageAlignment;
}

type CalloutTone = 'default' | 'info' | 'success' | 'warning' | 'danger';
type NoteAiAction = 'improve' | 'summarize' | 'bulletize';
type AiNoticeTone = 'info' | 'success' | 'error';

interface RowHandleTarget {
  pos: number;
  nodeSize: number;
  type: string;
}

interface BlockMenuAnchor {
  top: number;
  left: number;
}

interface EmojiPickerState {
  pos: number;
  top: number;
  left: number;
}

interface EmojiOption {
  emoji: string;
  keywords: string[];
}

interface SelectedTextRange {
  start: number;
  end: number;
  text: string;
}

interface AiReviewState {
  action: NoteAiAction;
  selection: SelectedTextRange;
  beforeText: string;
  afterText: string;
}

interface AiNoticeState {
  tone: AiNoticeTone;
  message: string;
}

type AiDiffPartKind = 'same' | 'added' | 'removed';

interface AiDiffPart {
  kind: AiDiffPartKind;
  text: string;
}

interface AiDiffPreview {
  parts: AiDiffPart[];
  addedCount: number;
  removedCount: number;
}

interface RippleAiGatewayResponse {
  thread_id?: string;
  threadId?: string;
  assistant_message?: string;
  assistantMessage?: string;
}

const NOTE_AI_ACTION_ITEMS: Array<{
  id: NoteAiAction;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    id: 'improve',
    title: 'Perbaiki teks',
    description: 'Rapikan kalimat agar lebih jelas dan natural.',
    icon: '\u{1F9FD}',
  },
  {
    id: 'summarize',
    title: 'Ringkas teks',
    description: 'Buat ringkasan singkat dari bagian yang dipilih.',
    icon: '\u{1F4DD}',
  },
  {
    id: 'bulletize',
    title: 'Ubah jadi poin',
    description: 'Konversi teks menjadi bullet points yang rapi.',
    icon: '\u{1F4CC}',
  },
];

const IMAGE_QUALITY = 0.5;
const IMAGE_MAX_WIDTH = 1200;
const IMAGE_MIN_WIDTH = 100;
const IMAGE_FALLBACK_MAX_WIDTH = 640;

const MARKDOWN_SYNTAX_RE =
  /(^\s{0,3}#{1,6}\s)|(^\s*[-*+]\s)|(^\s*\d+\.\s)|(^\s*>\s)|(```)|(\*\*[^*]+\*\*)|(_[^_]+_)|(\[[^\]]+\]\([^)]+\))|(^\s*\|.*\|)/m;

const CODE_KEYWORD_RE =
  /\b(const|let|var|function|class|import|export|return|if|else|for|while|switch|case|try|catch|throw|async|await)\b/;

const STACKTRACE_RE = /^\s*at\s+\S+/;
const URL_ONLY_RE = /^https?:\/\/\S+$/i;

type LinkPlatform = 'youtube' | 'instagram' | 'tiktok' | 'x' | 'facebook' | 'linkedin' | 'generic';

interface SharedLinkMeta {
  url: string;
  host: string;
  path: string;
  platform: LinkPlatform;
  platformLabel: string;
  platformIcon: string;
  title?: string;
  description?: string;
  authorName?: string;
  thumbnailUrl?: string;
  siteName?: string;
}

interface LinkPreviewResponse {
  data?: {
    url?: string;
    host?: string;
    path?: string;
    title?: string;
    description?: string;
    author_name?: string;
    authorName?: string;
    thumbnail_url?: string;
    thumbnailUrl?: string;
    site_name?: string;
    siteName?: string;
  };
}

type TodoEmbedPriority = 'high' | 'medium' | 'low';

interface TodoEmbedMeta {
  id?: string;
  title: string;
  category: string;
  priority: TodoEmbedPriority;
  isCompleted: boolean;
  priorityColor: string;
  priorityTint: string;
}

const TODO_PRIORITY_STYLES: Record<TodoEmbedPriority, { color: string; tint: string }> = {
  high: {
    color: '#FFB74D',
    tint: 'rgba(255, 183, 77, 0.18)',
  },
  medium: {
    color: '#B4D8F6',
    tint: 'rgba(180, 216, 246, 0.28)',
  },
  low: {
    color: '#AED581',
    tint: 'rgba(174, 213, 129, 0.22)',
  },
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJsonRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'string') return null;
  try {
    const parsed = JSON.parse(value);
    return isObjectRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function resolveTodoEmbedPayload(payloadRaw: unknown): TodoEmbedMeta | null {
  const payload = parseJsonRecord(payloadRaw);
  if (!payload) return null;

  const insertPayload = isObjectRecord(payload.insert) ? payload.insert : null;
  if (!insertPayload) return null;

  let todoRaw: unknown = null;

  if (typeof insertPayload.custom === 'string') {
    const customPayload = parseJsonRecord(insertPayload.custom);
    if (customPayload && customPayload.todo_item) {
      todoRaw = customPayload.todo_item;
    }
  } else if (insertPayload.todo_item) {
    todoRaw = insertPayload.todo_item;
  }

  const todoPayload =
    isObjectRecord(todoRaw) ? todoRaw : typeof todoRaw === 'string' ? parseJsonRecord(todoRaw) : null;

  if (!todoPayload) return null;

  const rawPriority = typeof todoPayload.priority === 'string' ? todoPayload.priority.toLowerCase().trim() : '';
  const priority: TodoEmbedPriority =
    rawPriority === 'high' || rawPriority === 'low' || rawPriority === 'medium' ? rawPriority : 'medium';
  const style = TODO_PRIORITY_STYLES[priority];

  const titleRaw = typeof todoPayload.title === 'string' ? todoPayload.title.trim() : '';
  const categoryRaw = typeof todoPayload.category === 'string' ? todoPayload.category.trim() : '';

  const isCompletedRaw =
    typeof todoPayload.is_completed === 'boolean'
      ? todoPayload.is_completed
      : typeof todoPayload.isCompleted === 'boolean'
        ? todoPayload.isCompleted
        : false;

  return {
    id: typeof todoPayload.id === 'string' ? todoPayload.id : undefined,
    title: titleRaw || 'Untitled todo',
    category: categoryRaw || 'General',
    priority,
    isCompleted: isCompletedRaw,
    priorityColor: style.color,
    priorityTint: style.tint,
  };
}

function updateTodoEmbedCompletionPayload(payloadRaw: unknown, nextCompleted: boolean): string | null {
  const payload = parseJsonRecord(payloadRaw);
  if (!payload) return null;

  const insertPayload = isObjectRecord(payload.insert) ? { ...payload.insert } : null;
  if (!insertPayload) return null;

  const nowIso = new Date().toISOString();

  if (typeof insertPayload.custom === 'string') {
    const customPayload = parseJsonRecord(insertPayload.custom);
    if (!customPayload || !customPayload.todo_item) return null;

    const todoPayload =
      isObjectRecord(customPayload.todo_item)
        ? { ...customPayload.todo_item }
        : typeof customPayload.todo_item === 'string'
          ? parseJsonRecord(customPayload.todo_item)
          : null;

    if (!todoPayload) return null;

    todoPayload.is_completed = nextCompleted;
    if ('isCompleted' in todoPayload) {
      todoPayload.isCompleted = nextCompleted;
    }
    todoPayload.completed_at = nextCompleted ? nowIso : null;
    if ('completedAt' in todoPayload) {
      todoPayload.completedAt = nextCompleted ? nowIso : null;
    }
    if ('updated_at' in todoPayload) {
      todoPayload.updated_at = nowIso;
    }
    if ('updatedAt' in todoPayload) {
      todoPayload.updatedAt = nowIso;
    }

    customPayload.todo_item = JSON.stringify(todoPayload);
    insertPayload.custom = JSON.stringify(customPayload);
    payload.insert = insertPayload;
    return JSON.stringify(payload);
  }

  if (insertPayload.todo_item) {
    const todoPayload =
      isObjectRecord(insertPayload.todo_item)
        ? { ...insertPayload.todo_item }
        : typeof insertPayload.todo_item === 'string'
          ? parseJsonRecord(insertPayload.todo_item)
          : null;
    if (!todoPayload) return null;

    todoPayload.is_completed = nextCompleted;
    if ('isCompleted' in todoPayload) {
      todoPayload.isCompleted = nextCompleted;
    }
    todoPayload.completed_at = nextCompleted ? nowIso : null;
    if ('completedAt' in todoPayload) {
      todoPayload.completedAt = nextCompleted ? nowIso : null;
    }
    if ('updated_at' in todoPayload) {
      todoPayload.updated_at = nowIso;
    }
    if ('updatedAt' in todoPayload) {
      todoPayload.updatedAt = nowIso;
    }

    insertPayload.todo_item = JSON.stringify(todoPayload);
    payload.insert = insertPayload;
    return JSON.stringify(payload);
  }

  return null;
}

function compactHost(host: string): string {
  return host.replace(/^www\./i, '').trim();
}

function detectLinkPlatform(host: string): LinkPlatform {
  const normalized = compactHost(host).toLowerCase();
  if (normalized.includes('youtube.com') || normalized.includes('youtu.be')) return 'youtube';
  if (normalized.includes('instagram.com')) return 'instagram';
  if (normalized.includes('tiktok.com')) return 'tiktok';
  if (normalized.includes('twitter.com') || normalized.includes('x.com')) return 'x';
  if (normalized.includes('facebook.com') || normalized.includes('fb.watch')) return 'facebook';
  if (normalized.includes('linkedin.com')) return 'linkedin';
  return 'generic';
}

function removeTrackingParams(url: URL): void {
  const paramsToDrop: string[] = [];
  url.searchParams.forEach((_value, key) => {
    const normalized = key.toLowerCase();
    if (
      normalized.startsWith('utm_') ||
      normalized === 'fbclid' ||
      normalized === 'gclid' ||
      normalized === 'igshid' ||
      normalized === 'si'
    ) {
      paramsToDrop.push(key);
    }
  });
  paramsToDrop.forEach((key) => url.searchParams.delete(key));
}

function canonicalizeSocialUrl(rawUrl: string): string {
  const parsed = new URL(rawUrl);
  parsed.hash = '';
  removeTrackingParams(parsed);

  const platform = detectLinkPlatform(parsed.host);
  const host = compactHost(parsed.host).toLowerCase();

  if (platform === 'youtube') {
    if (host === 'youtu.be') {
      const videoId = parsed.pathname.replace(/^\/+/, '').split('/')[0] || '';
      if (videoId) {
        const timestamp = parsed.searchParams.get('t');
        parsed.hostname = 'www.youtube.com';
        parsed.pathname = '/watch';
        parsed.search = '';
        parsed.searchParams.set('v', videoId);
        if (timestamp) parsed.searchParams.set('t', timestamp);
      }
    } else {
      parsed.hostname = 'www.youtube.com';
    }
  }

  if (platform === 'instagram') parsed.hostname = 'www.instagram.com';
  if (platform === 'tiktok') parsed.hostname = 'www.tiktok.com';
  if (platform === 'x') parsed.hostname = 'x.com';

  return parsed.toString();
}

function platformLabel(platform: LinkPlatform): string {
  switch (platform) {
    case 'youtube':
      return 'YouTube';
    case 'instagram':
      return 'Instagram';
    case 'tiktok':
      return 'TikTok';
    case 'x':
      return 'X';
    case 'facebook':
      return 'Facebook';
    case 'linkedin':
      return 'LinkedIn';
    default:
      return 'Link';
  }
}

function platformIcon(platform: LinkPlatform): string {
  switch (platform) {
    case 'youtube':
      return 'https://cdn.simpleicons.org/youtube/FF0000';
    case 'instagram':
      return 'https://cdn.simpleicons.org/instagram/E4405F';
    case 'tiktok':
      return 'https://cdn.simpleicons.org/tiktok/111111';
    case 'x':
      return 'https://cdn.simpleicons.org/x/111111';
    case 'facebook':
      return 'https://cdn.simpleicons.org/facebook/1877F2';
    case 'linkedin':
      return 'https://cdn.simpleicons.org/linkedin/0A66C2';
    default:
      return '\u{1F517}';
  }
}

function isRemoteIcon(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function buildDisplayUrl(url: string, fallbackPath = ''): string {
  try {
    const parsed = new URL(url);
    return `${compactHost(parsed.host)}${parsed.pathname}${parsed.search}`;
  } catch {
    return fallbackPath || url;
  }
}

function normalizePastedUrl(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const unwrapped = trimmed.replace(/^<(.+)>$/, '$1').trim();
  if (!URL_ONLY_RE.test(unwrapped)) return null;

  try {
    const parsed = new URL(unwrapped);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return canonicalizeSocialUrl(parsed.toString());
  } catch {
    return null;
  }
}

function buildSharedLinkMeta(url: string): SharedLinkMeta {
  try {
    const normalizedUrl = canonicalizeSocialUrl(url);
    const parsed = new URL(normalizedUrl);
    const host = compactHost(parsed.host || '');
    const path = `${parsed.pathname || ''}${parsed.search || ''}`;
    const platform = detectLinkPlatform(host);
    return {
      url: normalizedUrl,
      host,
      path,
      platform,
      platformLabel: platformLabel(platform),
      platformIcon: platformIcon(platform),
      title: undefined,
      description: undefined,
      authorName: undefined,
      thumbnailUrl: undefined,
      siteName: undefined,
    };
  } catch {
    return {
      url,
      host: '',
      path: '',
      platform: 'generic',
      platformLabel: 'Link',
      platformIcon: '\u{1F517}',
      title: undefined,
      description: undefined,
      authorName: undefined,
      thumbnailUrl: undefined,
      siteName: undefined,
    };
  }
}

function cleanPreviewValue(value: unknown, max = 500): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

function mergeSharedLinkMeta(base: SharedLinkMeta, preview?: LinkPreviewResponse['data']): SharedLinkMeta {
  if (!preview) return base;
  const url = cleanPreviewValue(preview.url, 1200) || base.url;
  const normalized = buildSharedLinkMeta(url);
  const host = cleanPreviewValue(preview.host, 200) || normalized.host || base.host;
  const path = cleanPreviewValue(preview.path, 400) || normalized.path || base.path;
  const platform = detectLinkPlatform(host || normalized.host || base.host);

  return {
    ...base,
    ...normalized,
    url,
    host,
    path,
    platform,
    platformLabel: platformLabel(platform),
    platformIcon: platformIcon(platform),
    title: cleanPreviewValue(preview.title, 220) || base.title,
    description: cleanPreviewValue(preview.description, 320) || base.description,
    authorName:
      cleanPreviewValue(preview.author_name, 120) ||
      cleanPreviewValue(preview.authorName, 120) ||
      base.authorName,
    thumbnailUrl:
      cleanPreviewValue(preview.thumbnail_url, 1400) ||
      cleanPreviewValue(preview.thumbnailUrl, 1400) ||
      base.thumbnailUrl,
    siteName:
      cleanPreviewValue(preview.site_name, 100) ||
      cleanPreviewValue(preview.siteName, 100) ||
      base.siteName,
  };
}

function buildSharedLinkPayload(meta: SharedLinkMeta): string {
  return JSON.stringify({
    url: meta.url,
    ...(meta.host ? { host: meta.host } : {}),
    ...(meta.path ? { path: meta.path } : {}),
    ...(meta.title ? { title: meta.title } : {}),
    ...(meta.description ? { description: meta.description } : {}),
    ...(meta.authorName ? { author_name: meta.authorName } : {}),
    ...(meta.thumbnailUrl ? { thumbnail_url: meta.thumbnailUrl } : {}),
    ...(meta.siteName ? { site_name: meta.siteName } : {}),
  });
}

async function fetchLinkPreview(url: string, timeoutMs = 1600): Promise<LinkPreviewResponse['data'] | undefined> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) return undefined;
    const payload = (await response.json()) as LinkPreviewResponse;
    return payload?.data;
  } catch {
    return undefined;
  } finally {
    window.clearTimeout(timer);
  }
}

const CALLOUT_EMOJI_OPTIONS: EmojiOption[] = [
  { emoji: '\u{1F4A1}', keywords: ['idea', 'tip', 'note', 'insight'] },
  { emoji: '\u{1F4CC}', keywords: ['pin', 'important', 'highlight'] },
  { emoji: '\u{1F4A5}', keywords: ['alert', 'impact', 'attention'] },
  { emoji: '\u{26A0}\u{FE0F}', keywords: ['warning', 'caution', 'risk'] },
  { emoji: '\u{1F6A8}', keywords: ['urgent', 'alarm', 'important'] },
  { emoji: '\u{2705}', keywords: ['done', 'check', 'success'] },
  { emoji: '\u{1F3AF}', keywords: ['goal', 'target', 'focus'] },
  { emoji: '\u{1F680}', keywords: ['launch', 'growth', 'fast'] },
  { emoji: '\u{1F525}', keywords: ['hot', 'priority', 'fire'] },
  { emoji: '\u{1F9E0}', keywords: ['think', 'brain', 'smart'] },
  { emoji: '\u{1F4D8}', keywords: ['book', 'reference', 'learn'] },
  { emoji: '\u{1F4DA}', keywords: ['library', 'docs', 'material'] },
  { emoji: '\u{1F4C8}', keywords: ['chart', 'progress', 'data'] },
  { emoji: '\u{1F4CA}', keywords: ['stats', 'analytics', 'report'] },
  { emoji: '\u{1F4E2}', keywords: ['announce', 'broadcast', 'reminder'] },
  { emoji: '\u{1F4E3}', keywords: ['megaphone', 'promotion', 'speak'] },
  { emoji: '\u{1F4DD}', keywords: ['write', 'draft', 'notes'] },
  { emoji: '\u{1F5D2}\u{FE0F}', keywords: ['list', 'outline', 'plan'] },
  { emoji: '\u{1F5C2}\u{FE0F}', keywords: ['folder', 'archive', 'group'] },
  { emoji: '\u{1F517}', keywords: ['link', 'source', 'reference'] },
  { emoji: '\u{1F527}', keywords: ['tool', 'setup', 'config'] },
  { emoji: '\u{2699}\u{FE0F}', keywords: ['settings', 'process', 'system'] },
  { emoji: '\u{1F6E0}\u{FE0F}', keywords: ['build', 'fix', 'repair'] },
  { emoji: '\u{1F4BB}', keywords: ['computer', 'dev', 'code'] },
  { emoji: '\u{1F5A5}\u{FE0F}', keywords: ['desktop', 'web', 'app'] },
  { emoji: '\u{1F4F1}', keywords: ['mobile', 'phone', 'android'] },
  { emoji: '\u{1F50E}', keywords: ['search', 'investigate', 'find'] },
  { emoji: '\u{1F4A3}', keywords: ['problem', 'issue', 'critical'] },
  { emoji: '\u{1F6D1}', keywords: ['stop', 'block', 'warning'] },
  { emoji: '\u{1F4E6}', keywords: ['package', 'ship', 'bundle'] },
  { emoji: '\u{1F4B0}', keywords: ['money', 'cost', 'budget'] },
  { emoji: '\u{1F4C5}', keywords: ['date', 'deadline', 'schedule'] },
  { emoji: '\u{23F0}', keywords: ['time', 'urgent', 'reminder'] },
  { emoji: '\u{1F6A7}', keywords: ['work in progress', 'wip', 'construction'] },
  { emoji: '\u{1F64C}', keywords: ['celebrate', 'done', 'win'] },
  { emoji: '\u{1F44D}', keywords: ['approve', 'good', 'yes'] },
  { emoji: '\u{1F914}', keywords: ['question', 'think', 'hmm'] },
  { emoji: '\u{1F4AC}', keywords: ['comment', 'discussion', 'talk'] },
  { emoji: '\u{1F9D1}\u{200D}\u{1F3EB}', keywords: ['teacher', 'explain', 'guide'] },
  { emoji: '\u{1F9EA}', keywords: ['experiment', 'test', 'lab'] },
];

function looksLikeCodeLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (STACKTRACE_RE.test(trimmed)) return true;
  if (/[A-Za-z0-9_./-]+\.(ts|tsx|js|jsx|py|dart|java|go|rb|php|rs|cs|kt|swift):\d+(:\d+)?/i.test(trimmed)) {
    return true;
  }
  if (CODE_KEYWORD_RE.test(trimmed)) return true;
  if (/=>|[{}`;$]/.test(trimmed)) return true;
  if (/^\s*(\}|\]|\)|<\w|\/\/|#include)/.test(trimmed)) return true;
  return false;
}

function looksLikeMarkdownSyntax(text: string): boolean {
  return MARKDOWN_SYNTAX_RE.test(text);
}

function looksLikeCodeBlock(text: string): boolean {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return false;

  let score = 0;
  for (const line of lines) {
    if (STACKTRACE_RE.test(line)) score += 3;
    if (/[A-Za-z0-9_./-]+\.(ts|tsx|js|jsx|py|dart|java|go|rb|php|rs|cs|kt|swift):\d+(:\d+)?/i.test(line)) {
      score += 2;
    }
    if (CODE_KEYWORD_RE.test(line)) score += 2;
    if (/=>|[{}`;$]/.test(line)) score += 1;
  }

  return score >= Math.max(2, Math.ceil(lines.length * 1.25));
}

function normalizeSmartMarkdownPaste(rawText: string): string {
  const normalized = rawText.replace(/\r\n/g, '\n').trim();
  if (!normalized) return '';

  if (/```|~~~/.test(normalized)) {
    return normalized;
  }

  const blocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  if (blocks.length === 1) {
    const lines = normalized.split('\n');
    const firstCodeLineIndex = lines.findIndex((line, index) => index > 0 && looksLikeCodeLine(line));
    if (firstCodeLineIndex > 0) {
      const before = lines.slice(0, firstCodeLineIndex).join('\n').trim();
      const code = lines.slice(firstCodeLineIndex).join('\n').trim();
      if (before && code) {
        return `${before}\n\n\`\`\`\n${code}\n\`\`\``;
      }
    }
  }

  const smartBlocks = blocks.map((block) => {
    if (looksLikeMarkdownSyntax(block)) return block;
    if (looksLikeCodeBlock(block)) {
      return `\`\`\`\n${block}\n\`\`\``;
    }
    return block;
  });

  return smartBlocks.join('\n\n');
}

function looksLikeSmartPasteCandidate(text: string): boolean {
  return looksLikeMarkdownSyntax(text) || looksLikeCodeBlock(text);
}

function normalizeCalloutTone(value: unknown): CalloutTone {
  if (value === 'default' || value === 'info' || value === 'success' || value === 'warning' || value === 'danger') {
    return value;
  }
  return 'info';
}

function normalizeCalloutIcon(value: unknown): string {
  if (typeof value !== 'string') return '\u{1F4A1}';
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : '\u{1F4A1}';
}

function buildNoteAiPrompt(action: NoteAiAction, sourceText: string): string {
  switch (action) {
    case 'improve':
      return `Perbaiki teks catatan berikut agar lebih jelas, natural, dan rapi. Jangan tambahkan informasi baru. Kembalikan hanya teks final tanpa markdown.\n\nTeks:\n${sourceText}`;
    case 'summarize':
      return `Buat ringkasan catatan berikut dalam 3-5 kalimat singkat bahasa Indonesia. Fokus ke inti informasi dan langkah penting dari teks ini saja. Kembalikan hanya teks ringkasan tanpa markdown.\n\nTeks:\n${sourceText}`;
    case 'bulletize':
      return `Ubah teks berikut menjadi poin-poin bullet yang rapi dalam bahasa Indonesia. Kembalikan hasil final siap tempel tanpa penjelasan tambahan.\n\nTeks:\n${sourceText}`;
    default:
      return sourceText;
  }
}

function cleanupAiText(text: string): string {
  let output = text.trim();
  if (!output) return '';

  const fencedCode = output.match(/^```(?:[\w-]+)?\s*([\s\S]*?)\s*```$/);
  if (fencedCode?.[1]) {
    output = fencedCode[1].trim();
  }

  return output.replace(/\*\*/g, '').trim();
}

function tokenizeTextForDiff(text: string): string[] {
  const tokens = text.match(/(\s+|[^\s]+)/g);
  return tokens ? tokens : [];
}

function buildAiDiffPreview(beforeText: string, afterText: string): AiDiffPreview {
  const beforeTokens = tokenizeTextForDiff(beforeText);
  const afterTokens = tokenizeTextForDiff(afterText);

  const maxCells = 180_000;
  if (beforeTokens.length * afterTokens.length > maxCells) {
    return {
      parts: [
        { kind: 'removed', text: beforeText },
        { kind: 'added', text: afterText },
      ],
      addedCount: afterTokens.length,
      removedCount: beforeTokens.length,
    };
  }

  const rows = beforeTokens.length;
  const cols = afterTokens.length;
  const lcs: number[][] = Array.from({ length: rows + 1 }, () =>
    Array.from({ length: cols + 1 }, () => 0),
  );

  for (let i = 1; i <= rows; i += 1) {
    for (let j = 1; j <= cols; j += 1) {
      if (beforeTokens[i - 1] === afterTokens[j - 1]) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }

  const reversedParts: AiDiffPart[] = [];
  let i = rows;
  let j = cols;
  let addedCount = 0;
  let removedCount = 0;

  while (i > 0 && j > 0) {
    if (beforeTokens[i - 1] === afterTokens[j - 1]) {
      reversedParts.push({ kind: 'same', text: beforeTokens[i - 1] });
      i -= 1;
      j -= 1;
      continue;
    }

    if (lcs[i - 1][j] >= lcs[i][j - 1]) {
      reversedParts.push({ kind: 'removed', text: beforeTokens[i - 1] });
      removedCount += 1;
      i -= 1;
    } else {
      reversedParts.push({ kind: 'added', text: afterTokens[j - 1] });
      addedCount += 1;
      j -= 1;
    }
  }

  while (i > 0) {
    reversedParts.push({ kind: 'removed', text: beforeTokens[i - 1] });
    removedCount += 1;
    i -= 1;
  }
  while (j > 0) {
    reversedParts.push({ kind: 'added', text: afterTokens[j - 1] });
    addedCount += 1;
    j -= 1;
  }

  const mergedParts = reversedParts.reverse().reduce<AiDiffPart[]>((acc, part) => {
    const last = acc[acc.length - 1];
    if (last && last.kind === part.kind) {
      last.text += part.text;
      return acc;
    }
    acc.push({ ...part });
    return acc;
  }, []);

  return {
    parts: mergedParts,
    addedCount,
    removedCount,
  };
}

function extractImageFilesFromClipboard(event: ClipboardEvent): File[] {
  const clipboard = event.clipboardData;
  if (!clipboard) return [];

  const fromItems: File[] = Array.from(clipboard.items || [])
    .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
    .map((item) => item.getAsFile())
    .filter((file): file is File => !!file);

  if (fromItems.length > 0) return fromItems;

  return Array.from(clipboard.files || []).filter((file) => file.type.startsWith('image/'));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseImageStyle(styleRaw: unknown): ParsedImageStyle {
  const style = typeof styleRaw === 'string' ? styleRaw : '';
  const widthMatch = /width:\s*([\d.]+)\s*px?/i.exec(style);
  const rawWidth = widthMatch ? Number(widthMatch[1]) : NaN;
  const width = Number.isFinite(rawWidth) && rawWidth > 0 ? rawWidth : null;

  const styleLower = style.toLowerCase();
  const flutterAlignmentMatch = /flutteralignment:\s*([a-z]+)/i.exec(style);
  const flutterAlignment = flutterAlignmentMatch?.[1]?.toLowerCase() || '';

  let alignment: ImageAlignment = 'left';
  if (flutterAlignment.includes('center') || /text-align:\s*center/i.test(style)) {
    alignment = 'center';
  } else if (
    flutterAlignment.includes('right') ||
    styleLower.includes('topright') ||
    /text-align:\s*right/i.test(style)
  ) {
    alignment = 'right';
  }

  return { width, alignment };
}

function buildImageStyleRaw(width: number, alignment: ImageAlignment): string {
  const flutterAlignment =
    alignment === 'center' ? 'center' : alignment === 'right' ? 'topRight' : 'topLeft';
  return `width: ${Math.round(width)}px; flutterAlignment: ${flutterAlignment}`;
}

function buildImageStyle(styleRaw: unknown): string {
  const parsed = parseImageStyle(styleRaw);

  const css: string[] = [
    'display: block',
    'max-width: 100%',
    'height: auto',
    'margin-top: 8px',
    'margin-bottom: 8px',
  ];

  if (parsed.width) {
    css.push(`width: ${parsed.width}px`);
  }

  if (parsed.alignment === 'center') {
    css.push('margin-left: auto');
    css.push('margin-right: auto');
  } else if (parsed.alignment === 'right') {
    css.push('margin-left: auto');
    css.push('margin-right: 0');
  } else {
    css.push('margin-left: 0');
    css.push('margin-right: auto');
  }

  return `${css.join('; ')};`;
}

function resolveUploadMimeType(file: File): string {
  const supported = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (supported.includes(file.type)) return file.type;
  return 'image/jpeg';
}

function extensionFromMimeType(mimeType: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  return 'jpg';
}

function randomToken(length = 8): string {
  return Math.random().toString(36).slice(2, 2 + length);
}

function pickPublicUrl(result: any): string {
  if (typeof result === 'string') return result;
  if (typeof result?.data?.publicUrl === 'string') return result.data.publicUrl;
  return '';
}

async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to read image'));
    };
    image.src = url;
  });
}

async function compressImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  const mimeType = resolveUploadMimeType(file);
  if (mimeType === 'image/gif') return file;

  try {
    const image = await loadImageFromFile(file);
    const ratio = image.naturalWidth > IMAGE_MAX_WIDTH ? IMAGE_MAX_WIDTH / image.naturalWidth : 1;
    const targetWidth = Math.max(1, Math.round(image.naturalWidth * ratio));
    const targetHeight = Math.max(1, Math.round(image.naturalHeight * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, mimeType, mimeType === 'image/png' ? undefined : IMAGE_QUALITY);
    });
    if (!blob) return file;

    if (blob.size >= file.size && ratio >= 1) return file;

    const extension = extensionFromMimeType(mimeType);
    const baseName = file.name.replace(/\.[^/.]+$/, '') || `image_${Date.now()}`;
    return new File([blob], `${baseName}.${extension}`, {
      type: mimeType,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

const RippleEmbed = Node.create({
  name: RIPPLE_EMBED_NODE,
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      payload: {
        default: '',
      },
      label: {
        default: '[Embed]',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-ripple-embed="true"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const todo = resolveTodoEmbedPayload(HTMLAttributes.payload);
    if (todo) {
      const completedAttr = todo.isCompleted ? 'true' : 'false';
      const baseAttrs = {
        'data-ripple-embed': 'true',
        class: 'ripple-embed-chip ripple-embed-chip--todo',
        'data-todo-priority': todo.priority,
        'data-todo-completed': completedAttr,
        contenteditable: 'false',
        style: `--todo-priority-color: ${todo.priorityColor}; --todo-priority-bg: ${todo.priorityTint};`,
      } as Record<string, string>;

      if (todo.id) {
        baseAttrs['data-todo-id'] = todo.id;
      }

      return [
        'span',
        mergeAttributes(HTMLAttributes, baseAttrs),
        ['span', { class: 'ripple-embed-todo__status', 'aria-hidden': 'true' }, todo.isCompleted ? '\u2713' : ''],
        ['span', { class: 'ripple-embed-todo__title' }, todo.title],
        ['span', { class: 'ripple-embed-todo__category' }, todo.category],
      ];
    }

    const label =
      typeof HTMLAttributes.label === 'string' && HTMLAttributes.label.length > 0
        ? HTMLAttributes.label
        : '[Embed]';

    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-ripple-embed': 'true',
        class: 'ripple-embed-chip',
        contenteditable: 'false',
      }),
      label,
    ];
  },
});

const RippleSharedLink = Node.create({
  name: RIPPLE_SHARED_LINK_NODE,
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      payload: {
        default: '',
      },
      url: {
        default: '',
      },
      host: {
        default: '',
      },
      path: {
        default: '',
      },
      title: {
        default: '',
      },
      description: {
        default: '',
      },
      authorName: {
        default: '',
      },
      thumbnailUrl: {
        default: '',
      },
      siteName: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-ripple-shared-link="true"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const url = typeof HTMLAttributes.url === 'string' ? HTMLAttributes.url.trim() : '';
    const host = typeof HTMLAttributes.host === 'string' ? HTMLAttributes.host.trim() : '';
    const path = typeof HTMLAttributes.path === 'string' ? HTMLAttributes.path.trim() : '';
    const titleFromAttr = typeof HTMLAttributes.title === 'string' ? HTMLAttributes.title.trim() : '';
    const descriptionFromAttr = typeof HTMLAttributes.description === 'string'
      ? HTMLAttributes.description.trim()
      : '';
    const authorFromAttr = typeof HTMLAttributes.authorName === 'string' ? HTMLAttributes.authorName.trim() : '';
    const siteNameFromAttr = typeof HTMLAttributes.siteName === 'string' ? HTMLAttributes.siteName.trim() : '';

    const derived = buildSharedLinkMeta(url);
    const finalHost = host || derived.host;
    const finalPath = path || derived.path;
    const finalPlatformLabel = derived.platformLabel;
    const finalPlatformIcon = derived.platformIcon;
    const sourceText = authorFromAttr || siteNameFromAttr || finalPlatformLabel || finalHost || 'Link';
    const headlineText =
      titleFromAttr || descriptionFromAttr || buildDisplayUrl(url, finalPath) || sourceText;
    const shouldShowHeadline =
      headlineText.trim().length > 0 && headlineText.trim().toLowerCase() !== sourceText.trim().toLowerCase();

    const badgeChild: any = isRemoteIcon(finalPlatformIcon)
      ? [
          'img',
          {
            src: finalPlatformIcon,
            alt: finalPlatformLabel,
            loading: 'lazy',
          },
        ]
      : finalPlatformIcon;

    const lineChildren: any[] = [
      ['span', { class: 'ripple-shared-link__source' }, sourceText],
    ];

    if (shouldShowHeadline) {
      lineChildren.push(['span', { class: 'ripple-shared-link__headline' }, headlineText]);
    }

    const anchorChildren: any[] = [
      ['span', { class: 'ripple-shared-link__badge', 'aria-hidden': 'true' }, badgeChild],
      ['span', { class: 'ripple-shared-link__line' }, ...lineChildren],
    ];

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-ripple-shared-link': 'true',
        class: 'ripple-shared-link',
        contenteditable: 'false',
      }),
      [
        'a',
        {
          class: 'ripple-shared-link__anchor',
          href: url || '#',
          target: '_blank',
          rel: 'noopener noreferrer nofollow',
        },
        ...anchorChildren,
      ],
    ];
  },
});

const RippleCallout = Node.create({
  name: RIPPLE_CALLOUT_NODE,
  group: 'block',
  content: 'block+',
  draggable: true,
  defining: true,

  addAttributes() {
    return {
      tone: {
        default: 'info',
      },
      icon: {
        default: '\u{1F4A1}',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-ripple-callout="true"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const tone = normalizeCalloutTone(HTMLAttributes.tone);
    const icon = normalizeCalloutIcon(HTMLAttributes.icon);

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-ripple-callout': 'true',
        'data-tone': tone,
        'data-icon': icon,
        class: `ripple-callout ripple-callout--${tone}`,
      }),
      ['div', { class: 'ripple-callout__icon', contenteditable: 'false' }, icon],
      ['div', { class: 'ripple-callout__content' }, 0],
    ];
  },
});

const RippleImage = Node.create({
  name: RIPPLE_IMAGE_NODE,
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: '',
      },
      payload: {
        default: '',
      },
      styleRaw: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'img[data-ripple-image="true"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, payload, styleRaw, ...rest } = HTMLAttributes as Record<string, any>;
    return [
      'img',
      mergeAttributes(rest, {
        'data-ripple-image': 'true',
        src: typeof src === 'string' ? src : '',
        style: buildImageStyle(styleRaw),
        class: 'ripple-embed-image',
        loading: 'lazy',
      }),
    ];
  },
});

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialContent,
  onChange,
  editable = true,
  userId,
}) => {
  const editorViewportRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const blockMenuRef = useRef<HTMLDivElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const uploadImageFilesRef = useRef<(files: File[], targetEditor?: any) => Promise<void>>(
    async () => {},
  );
  const smartPasteTextRef = useRef<(text: string, targetEditor?: any) => Promise<void>>(async () => {});
  const insertSharedLinkRef = useRef<(url: string, targetEditor?: any) => Promise<void>>(async () => {});
  const aiThreadIdRef = useRef<string | null>(null);
  const aiNoticeTimerRef = useRef<number | null>(null);
  const lastAppliedExternalRef = useRef('');
  const lastEmittedRef = useRef('');
  const isHydratingRef = useRef(false);
  const isAdjustingImageRef = useRef(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<SelectedImageState | null>(null);
  const [rowHandleTarget, setRowHandleTarget] = useState<RowHandleTarget | null>(null);
  const [isBlockMenuOpen, setIsBlockMenuOpen] = useState(false);
  const [blockMenuAnchor, setBlockMenuAnchor] = useState<BlockMenuAnchor | null>(null);
  const [calloutEmojiPicker, setCalloutEmojiPicker] = useState<EmojiPickerState | null>(null);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiSelection, setAiSelection] = useState<SelectedTextRange | null>(null);
  const [aiReview, setAiReview] = useState<AiReviewState | null>(null);
  const [aiNotice, setAiNotice] = useState<AiNoticeState | null>(null);

  const showAiNotice = useCallback((tone: AiNoticeTone, message: string) => {
    if (aiNoticeTimerRef.current) {
      window.clearTimeout(aiNoticeTimerRef.current);
    }
    setAiNotice({ tone, message });
    aiNoticeTimerRef.current = window.setTimeout(() => {
      setAiNotice(null);
      aiNoticeTimerRef.current = null;
    }, 2600);
  }, []);

  useEffect(() => {
    return () => {
      if (aiNoticeTimerRef.current) {
        window.clearTimeout(aiNoticeTimerRef.current);
      }
    };
  }, []);

  const resolveSelectedTextRange = useCallback((editorInstance: any): SelectedTextRange | null => {
    const selection = editorInstance?.state?.selection;
    if (!selection || selection.empty) return null;

    const start = Math.min(selection.from, selection.to);
    const end = Math.max(selection.from, selection.to);
    if (start < 0 || end <= start) return null;

    const selectedText = editorInstance.state.doc.textBetween(start, end, '\n', '\n').trim();
    if (!selectedText) return null;

    return {
      start,
      end,
      text: selectedText,
    };
  }, []);

  const getMaxImageWidth = useCallback(() => {
    const containerWidth = editorViewportRef.current?.clientWidth ?? IMAGE_FALLBACK_MAX_WIDTH;
    return Math.max(IMAGE_MIN_WIDTH, Math.round(containerWidth - 48));
  }, []);

  const syncSelectedImage = useCallback(
    (editorInstance: any) => {
      const selection = editorInstance.state.selection;
      if (!(selection instanceof NodeSelection) || selection.node.type.name !== RIPPLE_IMAGE_NODE) {
        setSelectedImage((prev) => {
          if (!prev) return prev;
          if (isAdjustingImageRef.current) {
            const existingNode = editorInstance.state.doc.nodeAt(prev.pos);
            if (existingNode && existingNode.type?.name === RIPPLE_IMAGE_NODE) {
              return prev;
            }
          }
          return null;
        });
        return;
      }

      const attrs = selection.node.attrs ?? {};
      const src = typeof attrs.src === 'string' ? attrs.src.trim() : '';
      if (!src) {
        setSelectedImage((prev) => (prev ? null : prev));
        return;
      }

      const parsed = parseImageStyle(attrs.styleRaw);
      const maxWidth = getMaxImageWidth();
      const width = clamp(parsed.width ?? maxWidth, IMAGE_MIN_WIDTH, maxWidth);

      setSelectedImage((prev) => {
        if (
          prev &&
          prev.pos === selection.from &&
          prev.src === src &&
          prev.width === width &&
          prev.alignment === parsed.alignment
        ) {
          return prev;
        }

        return {
          pos: selection.from,
          src,
          width,
          alignment: parsed.alignment,
        };
      });
    },
    [getMaxImageWidth],
  );

  useEffect(() => {
    if (!selectedImage) {
      isAdjustingImageRef.current = false;
    }
  }, [selectedImage]);

  const emitDeltaChange = useCallback(
    (editorInstance: any) => {
      if (isHydratingRef.current) return;
      try {
        const nextDelta = tipTapDocToDelta(editorInstance.getJSON());
        const signature = JSON.stringify(nextDelta);
        lastEmittedRef.current = signature;
        lastAppliedExternalRef.current = signature;
        onChange(nextDelta);
      } catch (error) {
        console.error('Failed to convert editor content to delta:', error);
      }
    },
    [onChange],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Typography,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: false,
        linkOnPaste: false,
        protocols: ['http', 'https', 'mailto', 'todo'],
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      RippleCallout,
      RippleImage,
      RippleSharedLink,
      RippleEmbed,
      Placeholder.configure({
        placeholder: 'Mulai mengetik catatan...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
    editable,
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[400px] px-4 py-2',
      },
      handleDOMEvents: {
        click: (_view, event) => {
          const target = event.target as HTMLElement | null;
          if (!target) return false;

          const todoToggle = target.closest('.ripple-embed-todo__status') as HTMLElement | null;
          if (todoToggle) {
            const todoCard = todoToggle.closest('[data-ripple-embed="true"][data-todo-id]') as HTMLElement | null;
            if (!todoCard) return false;

            const todoId = todoCard.getAttribute('data-todo-id')?.trim();
            if (!todoId) return true;

            event.preventDefault();
            event.stopPropagation();

            let pos = 0;
            try {
              pos = _view.posAtDOM(todoCard, 0);
            } catch {
              return true;
            }

            const node = _view.state.doc.nodeAt(pos);
            if (!node || node.type.name !== RIPPLE_EMBED_NODE) return true;

            const prevAttrs = node.attrs ?? {};
            const todoMeta = resolveTodoEmbedPayload(prevAttrs.payload);
            if (!todoMeta) return true;

            const nextCompleted = !todoMeta.isCompleted;
            const nextPayload = updateTodoEmbedCompletionPayload(prevAttrs.payload, nextCompleted);
            if (!nextPayload) return true;

            const optimisticAttrs = {
              ...prevAttrs,
              payload: nextPayload,
              label: `[Todo] ${todoMeta.title}`,
            };

            _view.dispatch(_view.state.tr.setNodeMarkup(pos, undefined, optimisticAttrs));

            void (async () => {
              const { error } = await supabase
                .from('todos')
                .update({
                  is_completed: nextCompleted,
                  completed_at: nextCompleted ? new Date().toISOString() : null,
                })
                .eq('id', todoId);

              if (error) {
                _view.dispatch(_view.state.tr.setNodeMarkup(pos, undefined, prevAttrs));
                console.error('Failed to toggle embedded todo:', error.message);
                showAiNotice('error', 'Gagal update status todo');
              }
            })();

            return true;
          }

          const todoCard = target.closest('[data-ripple-embed="true"][data-todo-id]') as HTMLElement | null;
          if (todoCard) {
            const todoId = todoCard.getAttribute('data-todo-id')?.trim();
            if (!todoId) return true;

            event.preventDefault();
            event.stopPropagation();
            window.location.assign(`/?todo=${encodeURIComponent(todoId)}`);
            return true;
          }

          const sharedLinkAnchor = target.closest('.ripple-shared-link__anchor') as HTMLAnchorElement | null;
          if (!sharedLinkAnchor) return false;

          const href = sharedLinkAnchor.getAttribute('href')?.trim() || '';
          if (!href || href === '#') return true;

          event.preventDefault();
          window.open(href, '_blank', 'noopener,noreferrer');
          return true;
        },
        mousedown: (view, event) => {
          if (!editable) return false;

          const target = event.target as HTMLElement | null;
          if (!target) return false;
          const iconElement = target.closest('.ripple-callout__icon') as HTMLElement | null;
          if (!iconElement) return false;
          const calloutElement = iconElement.closest('[data-ripple-callout="true"]') as HTMLElement | null;
          if (!calloutElement) return false;

          event.preventDefault();
          event.stopPropagation();

          const rect = iconElement.getBoundingClientRect();
          const panelWidth = 320;
          const maxLeft = Math.max(8, window.innerWidth - panelWidth - 8);
          const left = clamp(rect.left - 6, 8, maxLeft);

          let pos = 0;
          try {
            pos = view.posAtDOM(calloutElement, 0);
          } catch {
            return true;
          }

          setEmojiSearch('');
          setCalloutEmojiPicker({
            pos,
            top: rect.bottom + 8,
            left,
          });

          return true;
        },
      },
      handlePaste: (_view, event) => {
        if (!editable) return false;

        const imageFiles = extractImageFilesFromClipboard(event);
        if (imageFiles.length > 0) {
          event.preventDefault();
          void uploadImageFilesRef.current(imageFiles);
          return true;
        }

        const plainText = event.clipboardData?.getData('text/plain') || '';
        if (!plainText.trim()) return false;

        const pastedUrl = normalizePastedUrl(plainText);
        if (pastedUrl) {
          event.preventDefault();
          void insertSharedLinkRef.current(pastedUrl);
          return true;
        }

        if (!looksLikeSmartPasteCandidate(plainText)) return false;

        event.preventDefault();
        void smartPasteTextRef.current(plainText);
        return true;
      },
    },
    onTransaction: ({ editor: editorInstance, transaction }) => {
      if (transaction.docChanged) {
        emitDeltaChange(editorInstance);
      }
      if (transaction.docChanged || transaction.selectionSet) {
        syncSelectedImage(editorInstance);
      }
    },
    onSelectionUpdate: ({ editor: editorInstance }) => {
      syncSelectedImage(editorInstance);
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    const normalizedDelta = normalizeToDelta(initialContent);
    const signature = JSON.stringify(normalizedDelta);

    if (signature === lastAppliedExternalRef.current || signature === lastEmittedRef.current) {
      lastAppliedExternalRef.current = signature;
      return;
    }

    isHydratingRef.current = true;
    try {
      editor.commands.setContent(deltaToTipTapDoc(normalizedDelta), { emitUpdate: false });
      lastAppliedExternalRef.current = signature;
    } finally {
      isHydratingRef.current = false;
    }
  }, [editor, initialContent]);

  const callRippleAiGateway = useCallback(
    async (action: NoteAiAction, sourceText: string): Promise<string> => {
      const prompt = buildNoteAiPrompt(action, sourceText);

      const resolveAccessToken = async (): Promise<string | null> => {
        const { data: sessionData } = await supabase.auth.getSession();
        const currentToken = sessionData.session?.access_token?.trim() || '';
        if (currentToken) return currentToken;

        const { data: refreshData } = await supabase.auth.refreshSession();
        const refreshedToken = refreshData.session?.access_token?.trim() || '';
        return refreshedToken || null;
      };

      const body: Record<string, any> = {
        message: prompt,
        search_enabled: false,
      };
      if (aiThreadIdRef.current) {
        body.thread_id = aiThreadIdRef.current;
      }

      let accessToken = await resolveAccessToken();
      if (!accessToken) {
        throw new Error('Sesi login tidak ditemukan. Silakan login ulang lalu coba lagi.');
      }

      const sendGatewayRequest = async (token: string): Promise<Response> => {
        return await fetch('/api/ripple-ai-gateway', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
      };

      let response = await sendGatewayRequest(accessToken);
      if (response.status === 401) {
        const { data: refreshData } = await supabase.auth.refreshSession();
        const refreshedToken = refreshData.session?.access_token?.trim() || '';
        if (refreshedToken) {
          accessToken = refreshedToken;
          response = await sendGatewayRequest(accessToken);
        }
      }

      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const message =
          typeof (data as any)?.error === 'string'
            ? (data as any).error
            : typeof (data as any)?.message === 'string'
              ? (data as any).message
              : `Gagal memproses bantuan AI (${response.status}).`;
        throw new Error(message);
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Respons AI tidak valid.');
      }

      const payload = data as RippleAiGatewayResponse;
      const threadId =
        typeof payload.thread_id === 'string'
          ? payload.thread_id.trim()
          : typeof payload.threadId === 'string'
            ? payload.threadId.trim()
            : '';

      const assistantMessage =
        typeof payload.assistant_message === 'string'
          ? payload.assistant_message
          : typeof payload.assistantMessage === 'string'
            ? payload.assistantMessage
            : '';

      if (threadId) {
        aiThreadIdRef.current = threadId;
      }

      const cleaned = cleanupAiText(assistantMessage);
      if (!cleaned) {
        throw new Error('AI tidak mengembalikan hasil teks.');
      }
      return cleaned;
    },
    [],
  );

  const runAiAction = useCallback(
    async (action: NoteAiAction) => {
      if (!editor || editor.isDestroyed || isAiProcessing) return;

      const selected = aiSelection ?? resolveSelectedTextRange(editor);
      if (!selected) {
        setIsAiMenuOpen(false);
        showAiNotice('info', 'Pilih teks dulu sebelum menjalankan AI.');
        return;
      }

      setIsAiMenuOpen(false);
      setAiReview(null);
      setIsAiProcessing(true);
      setAiSelection(selected);

      try {
        const resultText = await callRippleAiGateway(action, selected.text);
        setAiReview({
          action,
          selection: selected,
          beforeText: selected.text,
          afterText: resultText,
        });
      } catch (error: any) {
        showAiNotice('error', error?.message || 'Gagal memproses bantuan AI.');
      } finally {
        setIsAiProcessing(false);
      }
    },
    [aiSelection, callRippleAiGateway, editor, isAiProcessing, resolveSelectedTextRange, showAiNotice],
  );

  const handleAiTap = useCallback(() => {
    if (!editable || !editor || editor.isDestroyed || isAiProcessing) return;
    const selected = resolveSelectedTextRange(editor);
    if (!selected) {
      showAiNotice('info', 'Pilih teks dulu sebelum menjalankan AI.');
      return;
    }
    setAiSelection(selected);
    setIsAiMenuOpen(true);
  }, [editable, editor, isAiProcessing, resolveSelectedTextRange, showAiNotice]);

  const closeAiMenu = useCallback(() => {
    if (isAiProcessing) return;
    setIsAiMenuOpen(false);
  }, [isAiProcessing]);

  const discardAiSuggestion = useCallback(() => {
    setAiReview(null);
    showAiNotice('info', 'Perubahan AI dibatalkan.');
  }, [showAiNotice]);

  const applyAiSuggestion = useCallback(() => {
    if (!editor || editor.isDestroyed || !aiReview) return;

    const replacement = aiReview.afterText;
    editor
      .chain()
      .focus()
      .insertContentAt({ from: aiReview.selection.start, to: aiReview.selection.end }, replacement)
      .setTextSelection(aiReview.selection.start + replacement.length)
      .run();

    setAiReview(null);
    setAiSelection(null);
    showAiNotice('success', 'Teks berhasil diperbarui oleh AI.');
  }, [aiReview, editor, showAiNotice]);

  useEffect(() => {
    if (!selectedImage) return;

    const onResize = () => {
      const maxWidth = getMaxImageWidth();
      setSelectedImage((prev) =>
        prev
          ? {
              ...prev,
              width: clamp(prev.width, IMAGE_MIN_WIDTH, maxWidth),
            }
          : prev,
      );
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [selectedImage, getMaxImageWidth]);

  const resolveUserId = useCallback(async (): Promise<string> => {
    if (userId && userId.trim().length > 0) return userId;

    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;

    const resolvedUserId = data.user?.id;
    if (!resolvedUserId) throw new Error('User not logged in');
    return resolvedUserId;
  }, [userId]);

  const uploadImageToBucket = useCallback(
    async (file: File): Promise<string> => {
      const resolvedUserId = await resolveUserId();
      const optimizedFile = await compressImageForUpload(file);
      const mimeType = resolveUploadMimeType(optimizedFile);
      const extension = extensionFromMimeType(mimeType);
      const fileName = `${Date.now()}_${randomToken(8)}.${extension}`;
      const path = `${resolvedUserId}/${fileName}`;

      const { error } = await (supabase as any).storage.from('note-images').upload(path, optimizedFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: mimeType,
      });
      if (error) throw error;

      const publicUrl = pickPublicUrl((supabase as any).storage.from('note-images').getPublicUrl(path));
      if (!publicUrl) throw new Error('Failed to get image URL');
      return publicUrl;
    },
    [resolveUserId],
  );

  const handleImageTap = useCallback(() => {
    if (!editable || isImageUploading) return;
    imageInputRef.current?.click();
  }, [editable, isImageUploading]);

  const uploadAndInsertImages = useCallback(
    async (files: File[], targetEditor?: any) => {
      if (!editable || files.length === 0) return;

      const editorInstance = targetEditor ?? editor;
      if (!editorInstance || editorInstance.isDestroyed) return;

      try {
        setIsImageUploading(true);
        setImageUploadError(null);

        for (const file of files) {
          const publicUrl = await uploadImageToBucket(file);
          if (editorInstance.isDestroyed) break;

          editorInstance
            .chain()
            .focus()
            .insertContent({
              type: RIPPLE_IMAGE_NODE,
              attrs: {
                src: publicUrl,
                styleRaw: '',
              },
            })
            .run();
          editorInstance.commands.enter();
        }
      } catch (error: any) {
        setImageUploadError(error?.message || 'Failed to upload image');
      } finally {
        setIsImageUploading(false);
      }
    },
    [editable, editor, uploadImageToBucket],
  );

  const handleSmartPasteText = useCallback(
    async (text: string, targetEditor?: any) => {
      if (!editable) return;

      const editorInstance = targetEditor ?? editor;
      if (!editorInstance || editorInstance.isDestroyed) return;

      try {
        const markdown = normalizeSmartMarkdownPaste(text);
        if (!markdown) return;

        const html = await Promise.resolve(
          marked.parse(markdown, {
            gfm: true,
            breaks: true,
          }),
        );

        if (!html || editorInstance.isDestroyed) return;

        editorInstance
          .chain()
          .focus()
          .insertContent(typeof html === 'string' ? html : String(html))
          .run();
      } catch (error: any) {
        setImageUploadError(error?.message || 'Failed to paste formatted text');
      }
    },
    [editable, editor],
  );

  const insertSharedLink = useCallback(
    async (url: string, targetEditor?: any) => {
      if (!editable) return;

      const editorInstance = targetEditor ?? editor;
      if (!editorInstance || editorInstance.isDestroyed) return;

      const fallbackMeta = buildSharedLinkMeta(url);
      const preview = await fetchLinkPreview(fallbackMeta.url);
      const meta = mergeSharedLinkMeta(fallbackMeta, preview);
      const sharedPayload = buildSharedLinkPayload(meta);

      editorInstance
        .chain()
        .focus()
        .insertContent({
          type: RIPPLE_SHARED_LINK_NODE,
          attrs: {
            payload: JSON.stringify({
              insert: {
                shared_link: sharedPayload,
              },
            }),
            url: meta.url,
            host: meta.host,
            path: meta.path,
            title: meta.title || '',
            description: meta.description || '',
            authorName: meta.authorName || '',
            thumbnailUrl: meta.thumbnailUrl || '',
            siteName: meta.siteName || '',
          },
        })
        .run();
    },
    [editable, editor],
  );

  useEffect(() => {
    uploadImageFilesRef.current = uploadAndInsertImages;
  }, [uploadAndInsertImages]);

  useEffect(() => {
    smartPasteTextRef.current = handleSmartPasteText;
  }, [handleSmartPasteText]);

  useEffect(() => {
    insertSharedLinkRef.current = insertSharedLink;
  }, [insertSharedLink]);

  const handleImagePicked = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';

      if (!file) return;
      await uploadAndInsertImages([file]);
    },
    [uploadAndInsertImages],
  );

  const closeBlockMenu = useCallback(() => {
    setIsBlockMenuOpen(false);
    setBlockMenuAnchor(null);
    if (editor) {
      (editor.commands as any).unlockDragHandle?.();
    }
  }, [editor]);

  const closeCalloutEmojiPicker = useCallback(() => {
    setCalloutEmojiPicker(null);
    setEmojiSearch('');
  }, []);

  const filteredCalloutEmojis = useMemo(() => {
    const query = emojiSearch.trim().toLowerCase();
    if (!query) return CALLOUT_EMOJI_OPTIONS;
    return CALLOUT_EMOJI_OPTIONS.filter((option) => {
      if (option.emoji.includes(query)) return true;
      return option.keywords.some((keyword) => keyword.includes(query));
    });
  }, [emojiSearch]);

  const aiDiffPreview = useMemo(() => {
    if (!aiReview) return null;
    return buildAiDiffPreview(aiReview.beforeText, aiReview.afterText);
  }, [aiReview]);

  const applyCalloutEmoji = useCallback(
    (emoji: string) => {
      if (!editor || !calloutEmojiPicker || editor.isDestroyed) return;
      editor
        .chain()
        .focus()
        .setNodeSelection(calloutEmojiPicker.pos)
        .updateAttributes(RIPPLE_CALLOUT_NODE, { icon: emoji })
        .run();
      closeCalloutEmojiPicker();
    },
    [editor, calloutEmojiPicker, closeCalloutEmojiPicker],
  );

  useEffect(() => {
    if (!isBlockMenuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!blockMenuRef.current) return;
      if (blockMenuRef.current.contains(event.target as globalThis.Node)) return;
      closeBlockMenu();
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeBlockMenu();
      }
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onEscape);
    window.addEventListener('scroll', closeBlockMenu, true);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onEscape);
      window.removeEventListener('scroll', closeBlockMenu, true);
    };
  }, [isBlockMenuOpen, closeBlockMenu]);

  useEffect(() => {
    if (!calloutEmojiPicker) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!emojiPickerRef.current) return;
      if (emojiPickerRef.current.contains(event.target as globalThis.Node)) return;
      closeCalloutEmojiPicker();
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeCalloutEmojiPicker();
      }
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onEscape);
    window.addEventListener('scroll', closeCalloutEmojiPicker, true);
    window.addEventListener('resize', closeCalloutEmojiPicker);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onEscape);
      window.removeEventListener('scroll', closeCalloutEmojiPicker, true);
      window.removeEventListener('resize', closeCalloutEmojiPicker);
    };
  }, [calloutEmojiPicker, closeCalloutEmojiPicker]);

  const handleDragNodeChange = useCallback(
    ({ node, pos }: { node: any; pos: number }) => {
      if (!node || typeof pos !== 'number' || pos < 0) {
        setRowHandleTarget(null);
        return;
      }
      setRowHandleTarget({
        pos,
        nodeSize: node.nodeSize,
        type: node.type?.name || 'unknown',
      });
    },
    [],
  );

  const openBlockMenu = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const rect = event.currentTarget.getBoundingClientRect();
      setBlockMenuAnchor({
        top: rect.bottom + 8,
        left: rect.left - 6,
      });
      setIsBlockMenuOpen(true);
      if (editor) {
        (editor.commands as any).lockDragHandle?.();
      }
    },
    [editor],
  );

  const insertBlockBelow = useCallback(
    (kind: 'callout' | 'todo' | 'code' | 'text') => {
      if (!editor || editor.isDestroyed) return;

      const insertPos = rowHandleTarget
        ? rowHandleTarget.pos + rowHandleTarget.nodeSize
        : editor.state.selection.to;

      let content: any = { type: 'paragraph' };

      if (kind === 'callout') {
        content = {
          type: RIPPLE_CALLOUT_NODE,
          attrs: { tone: 'success', icon: '\u{1F9D1}\u200D\u{1F3EB}' },
          content: [{ type: 'paragraph' }],
        };
      } else if (kind === 'todo') {
        content = {
          type: 'taskList',
          content: [{ type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph' }] }],
        };
      } else if (kind === 'code') {
        content = {
          type: 'codeBlock',
        };
      }

      editor.chain().focus().insertContentAt(insertPos, content).run();
      closeBlockMenu();
    },
    [editor, rowHandleTarget, closeBlockMenu],
  );

  const updateSelectedImageStyle = useCallback(
    (nextWidth: number, nextAlignment: ImageAlignment) => {
      if (!editor || !selectedImage) return;

      const maxWidth = getMaxImageWidth();
      const width = clamp(nextWidth, IMAGE_MIN_WIDTH, maxWidth);
      const styleRaw = buildImageStyleRaw(width, nextAlignment);

      const imageNode = editor.state.doc.nodeAt(selectedImage.pos);
      if (!imageNode || imageNode.type?.name !== RIPPLE_IMAGE_NODE) {
        setSelectedImage(null);
        return;
      }

      const nextAttrs = {
        ...imageNode.attrs,
        styleRaw,
      };

      const tr = editor.state.tr.setNodeMarkup(selectedImage.pos, undefined, nextAttrs);
      editor.view.dispatch(tr);

      setSelectedImage((prev) =>
        prev
          ? {
              ...prev,
              width,
              alignment: nextAlignment,
            }
          : prev,
      );
    },
    [editor, selectedImage, getMaxImageWidth],
  );

  const deleteSelectedImage = useCallback(() => {
    if (!editor || !selectedImage) return;
    const imageNode = editor.state.doc.nodeAt(selectedImage.pos);
    if (!imageNode || imageNode.type?.name !== RIPPLE_IMAGE_NODE) {
      setSelectedImage(null);
      return;
    }

    const tr = editor.state.tr.delete(selectedImage.pos, selectedImage.pos + imageNode.nodeSize);
    editor.view.dispatch(tr);
    setSelectedImage(null);
  }, [editor, selectedImage]);

  const beginImageAdjust = useCallback(() => {
    isAdjustingImageRef.current = true;
  }, []);

  const endImageAdjust = useCallback(() => {
    isAdjustingImageRef.current = false;
    if (editor && !editor.isDestroyed) {
      syncSelectedImage(editor);
    }
  }, [editor, syncSelectedImage]);

  if (!editor) return null;

  const imageMaxWidth = getMaxImageWidth();
  const imageControlsVisible = editable && !!selectedImage;
  const currentImageWidth = selectedImage?.width ?? imageMaxWidth;
  const currentImageAlignment: ImageAlignment = selectedImage?.alignment ?? 'left';

  return (
    <div className="w-full flex-1 flex flex-col note-editor-container bg-white relative">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImagePicked}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .note-editor-container .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .note-editor-container .ProseMirror h1 { font-size: 2.25rem; font-weight: 700; margin-bottom: 0.8rem; color: #1e293b; font-family: 'Balsamiq Sans', cursive; line-height: 1.25; }
        .note-editor-container .ProseMirror h2 { font-size: 1.75rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.6rem; color: #334155; font-family: 'Balsamiq Sans', cursive; line-height: 1.3; }
        .note-editor-container .ProseMirror h3 { font-size: 1.35rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem; color: #334155; line-height: 1.35; }
        .note-editor-container .ProseMirror p { font-size: 1rem; line-height: 1.5; color: #334155; margin-bottom: 0.35rem; }
        .note-editor-container .ProseMirror ul[data-type="taskList"] { list-style: none; padding: 0; }
        .note-editor-container .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; margin-bottom: 0.35rem; }
        .note-editor-container .ProseMirror ul[data-type="taskList"] li > label { margin-right: 0.75rem; user-select: none; padding-top: 0.15rem; }
        .note-editor-container .ProseMirror ul[data-type="taskList"] input[type="checkbox"] { 
          width: 1.25rem; height: 1.25rem; cursor: pointer; accent-color: var(--primary);
        }
        .note-editor-container .ProseMirror p code {
          background: #0f172a14;
          border-radius: 0.35rem;
          padding: 0.15rem 0.35rem;
          font-size: 0.92em;
          font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
        }
        .note-editor-container .ProseMirror pre {
          background: #111827;
          color: #e5e7eb;
          border-radius: 0.9rem;
          padding: 0.85rem 1rem;
          margin: 0.8rem 0;
          overflow-x: auto;
          line-height: 1.6;
          font-size: 0.92rem;
          font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
        }
        .note-editor-container .ProseMirror pre code {
          background: transparent;
          color: inherit;
          padding: 0;
          font-size: inherit;
          font-family: inherit;
        }
        .note-editor-container .ProseMirror .ripple-callout {
          display: flex;
          gap: 0.75rem;
          border-radius: 1rem;
          padding: 0.95rem 1rem;
          margin: 0.8rem 0;
          border: 1px solid transparent;
        }
        .note-editor-container .ProseMirror .ripple-callout__icon {
          font-size: 1.15rem;
          line-height: 1.5;
          user-select: none;
          padding-top: 0.05rem;
          width: 1.7rem;
          height: 1.7rem;
          border-radius: 0.45rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 120ms ease;
        }
        .note-editor-container .ProseMirror .ripple-callout__icon:hover {
          background: #ffffff80;
        }
        .note-editor-container .ProseMirror .ripple-callout__content {
          flex: 1;
          min-width: 0;
        }
        .note-editor-container .ProseMirror .ripple-callout__content > *:first-child {
          margin-top: 0;
        }
        .note-editor-container .ProseMirror .ripple-callout__content > *:last-child {
          margin-bottom: 0;
        }
        .note-editor-container .ProseMirror .ripple-callout--default {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }
        .note-editor-container .ProseMirror .ripple-callout--info {
          background: #e0f2fe;
          border-color: #7dd3fc;
        }
        .note-editor-container .ProseMirror .ripple-callout--success {
          background: #ecfdf3;
          border-color: #86efac;
        }
        .note-editor-container .ProseMirror .ripple-callout--warning {
          background: #fefce8;
          border-color: #facc15;
        }
        .note-editor-container .ProseMirror .ripple-callout--danger {
          background: #fef2f2;
          border-color: #fca5a5;
        }
        .note-editor-container .ProseMirror blockquote { border-left: 4px solid #cbd5e1; padding-left: 1rem; color: #64748b; font-style: italic; }
        .note-editor-container .ProseMirror .ripple-shared-link {
          margin: 0.1rem 0;
        }
        .note-editor-container .ProseMirror .ripple-shared-link__anchor {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          text-decoration: none;
          color: inherit;
          border-radius: 0.5rem;
          padding: 0.08rem 0.2rem 0.08rem 0.1rem;
          transition: background 120ms ease, transform 120ms ease;
        }
        .note-editor-container .ProseMirror .ripple-shared-link__anchor:hover {
          background: #f1f5f9;
        }
        .note-editor-container .ProseMirror .ripple-shared-link__badge {
          width: 1.05rem;
          min-width: 1.05rem;
          height: 1.05rem;
          border-radius: 0.22rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          font-size: 0.8rem;
          line-height: 1;
        }
        .note-editor-container .ProseMirror .ripple-shared-link__badge img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .note-editor-container .ProseMirror .ripple-shared-link__line {
          min-width: 0;
          display: inline-flex;
          align-items: baseline;
          gap: 0.35rem;
          max-width: 100%;
        }
        .note-editor-container .ProseMirror .ripple-shared-link__source {
          color: #6b7280;
          font-weight: 500;
          font-size: 0.78rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 9rem;
        }
        .note-editor-container .ProseMirror .ripple-shared-link__headline {
          color: #111827;
          font-weight: 700;
          font-size: 0.86rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: calc(100% - 9.5rem);
        }
        .note-editor-container .ProseMirror .ripple-embed-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.36rem;
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          color: #334155;
          font-size: 0.75rem;
          font-weight: 600;
          line-height: 1.2;
          padding: 0.3rem 0.52rem;
          margin: 0.1rem 0.16rem;
          white-space: nowrap;
          vertical-align: middle;
          max-width: 100%;
        }
        .note-editor-container .ProseMirror .ripple-embed-chip--todo {
          --todo-priority-color: #b4d8f6;
          --todo-priority-bg: rgba(180, 216, 246, 0.28);
          background: #ffffff;
          border-width: 1.5px;
          border-color: var(--todo-priority-color);
          padding: 0.34rem 0.64rem;
          box-shadow: 0 2px 4px rgba(15, 23, 42, 0.05);
          max-width: min(100%, 34rem);
          cursor: pointer;
        }
        .note-editor-container .ProseMirror .ripple-embed-chip--todo .ripple-embed-todo__status {
          width: 18px;
          min-width: 18px;
          height: 18px;
          border-radius: 999px;
          border: 2px solid var(--todo-priority-color);
          background: transparent;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.64rem;
          font-weight: 700;
          line-height: 1;
          transform: translateY(0.02rem);
          cursor: pointer;
        }
        .note-editor-container .ProseMirror .ripple-embed-chip--todo[data-todo-completed="true"] .ripple-embed-todo__status {
          background: var(--todo-priority-color);
        }
        .note-editor-container .ProseMirror .ripple-embed-chip--todo .ripple-embed-todo__title {
          font-size: 0.82rem;
          font-weight: 700;
          color: #334155;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .note-editor-container .ProseMirror .ripple-embed-chip--todo[data-todo-completed="true"] .ripple-embed-todo__title {
          color: #94a3b8;
          text-decoration: line-through;
        }
        .note-editor-container .ProseMirror .ripple-embed-chip--todo .ripple-embed-todo__category {
          padding: 0.12rem 0.38rem;
          border-radius: 0.45rem;
          font-size: 0.56rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--todo-priority-color);
          background: var(--todo-priority-bg);
          max-width: 8rem;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .note-editor-container .ProseMirror .ripple-embed-image {
          cursor: pointer;
        }
        .note-editor-container .ProseMirror .ripple-embed-image.ProseMirror-selectednode {
          outline: 2px solid #a3bffa;
          outline-offset: 2px;
          border-radius: 4px;
        }
        .ripple-row-handle {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 2px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.16);
        }
        .ripple-row-handle__btn {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          color: #475569;
          transition: background 120ms ease;
        }
        .ripple-row-handle__btn:hover {
          background: #f1f5f9;
        }
        .ripple-row-handle__drag {
          cursor: grab;
        }
        .ripple-row-handle__drag:active {
          cursor: grabbing;
        }
       `,
        }}
      />

      <div className="flex-1 overflow-y-auto pl-9" ref={editorViewportRef}>
        <EditorContent editor={editor} className="min-h-full" />
      </div>

      {imageUploadError && (
        <div className="px-4 py-2 text-xs font-medium text-red-500 border-t border-red-100 bg-red-50/60">
          {imageUploadError}
        </div>
      )}

      {aiNotice && (
        <div
          className={`px-4 py-2 text-xs font-medium border-t ${
            aiNotice.tone === 'success'
              ? 'text-emerald-700 border-emerald-100 bg-emerald-50/70'
              : aiNotice.tone === 'error'
                ? 'text-red-600 border-red-100 bg-red-50/70'
                : 'text-slate-700 border-slate-200 bg-slate-50/70'
          }`}
        >
          {aiNotice.message}
        </div>
      )}

      {editable && (
        <div
          className={`border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-3 ${imageControlsVisible ? '' : 'hidden'}`}
          onPointerDown={beginImageAdjust}
          onPointerUp={endImageAdjust}
          onPointerCancel={endImageAdjust}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-600 min-w-10">Size</span>
            <input
              type="range"
              min={IMAGE_MIN_WIDTH}
              max={imageMaxWidth}
              value={currentImageWidth}
              disabled={!selectedImage}
              onChange={(event) => {
                if (!selectedImage) return;
                updateSelectedImageStyle(Number(event.target.value), selectedImage.alignment);
              }}
              onBlur={endImageAdjust}
              className="flex-1 accent-[var(--primary)] disabled:opacity-50"
            />
            <span className="text-xs font-medium text-slate-500 min-w-9 text-right">
              {Math.round((currentImageWidth / imageMaxWidth) * 100)}%
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="inline-flex items-center rounded-xl bg-slate-100 p-1">
              <button
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  currentImageAlignment === 'left'
                    ? 'bg-white text-[var(--primary)] shadow-sm'
                    : 'text-slate-500'
                }`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectedImage && updateSelectedImageStyle(selectedImage.width, 'left')}
                type="button"
                disabled={!selectedImage}
              >
                <AlignLeft size={18} />
              </button>
              <button
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  currentImageAlignment === 'center'
                    ? 'bg-white text-[var(--primary)] shadow-sm'
                    : 'text-slate-500'
                }`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectedImage && updateSelectedImageStyle(selectedImage.width, 'center')}
                type="button"
                disabled={!selectedImage}
              >
                <AlignCenter size={18} />
              </button>
              <button
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  currentImageAlignment === 'right'
                    ? 'bg-white text-[var(--primary)] shadow-sm'
                    : 'text-slate-500'
                }`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectedImage && updateSelectedImageStyle(selectedImage.width, 'right')}
                type="button"
                disabled={!selectedImage}
              >
                <AlignRight size={18} />
              </button>
            </div>

            <button
              className="w-9 h-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center disabled:opacity-50"
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={deleteSelectedImage}
              disabled={!selectedImage}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      )}

      {editable && editor && (
        <DragHandle
          editor={editor}
          onNodeChange={handleDragNodeChange}
          computePositionConfig={{ placement: 'left-start', strategy: 'fixed', middleware: [offset({ mainAxis: 10 })] }}
        >
          <div className="ripple-row-handle">
            <button
              type="button"
              className="ripple-row-handle__btn"
              onMouseDown={(event) => event.preventDefault()}
              onClick={openBlockMenu}
              title="Add block"
            >
              <Plus size={14} />
            </button>
            <button
              type="button"
              className="ripple-row-handle__btn ripple-row-handle__drag"
              title="Drag block"
            >
              <GripVertical size={14} />
            </button>
          </div>
        </DragHandle>
      )}

      {editable && isBlockMenuOpen && blockMenuAnchor && (
        <div
          ref={blockMenuRef}
          style={{ top: blockMenuAnchor.top, left: blockMenuAnchor.left }}
          className="fixed z-[90] w-[280px] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
        >
          <div className="px-2 pt-1 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Add Block
          </div>
          <button
            type="button"
            className="w-full rounded-xl px-3 py-2 flex items-center gap-2 text-sm text-slate-700 hover:bg-slate-100"
            onClick={() => insertBlockBelow('callout')}
          >
            <NotebookPen size={16} className="text-emerald-600" />
            <span className="font-semibold">Callout</span>
          </button>
          <button
            type="button"
            className="w-full rounded-xl px-3 py-2 flex items-center gap-2 text-sm text-slate-700 hover:bg-slate-100"
            onClick={() => insertBlockBelow('todo')}
          >
            <SquareCheckBig size={16} className="text-sky-600" />
            <span className="font-semibold">To-do list</span>
          </button>
          <button
            type="button"
            className="w-full rounded-xl px-3 py-2 flex items-center gap-2 text-sm text-slate-700 hover:bg-slate-100"
            onClick={() => insertBlockBelow('code')}
          >
            <Code2 size={16} className="text-slate-700" />
            <span className="font-semibold">Code</span>
          </button>
          <button
            type="button"
            className="w-full rounded-xl px-3 py-2 flex items-center gap-2 text-sm text-slate-700 hover:bg-slate-100"
            onClick={() => insertBlockBelow('text')}
          >
            <Type size={16} className="text-slate-700" />
            <span className="font-semibold">Text</span>
          </button>
        </div>
      )}

      {editable && calloutEmojiPicker && (
        <div
          ref={emojiPickerRef}
          style={{ top: calloutEmojiPicker.top, left: calloutEmojiPicker.left }}
          className="fixed z-[95] w-[320px] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-700">Choose Callout Emoji</span>
            <button
              type="button"
              className="text-xs text-slate-500 hover:text-slate-700"
              onClick={closeCalloutEmojiPicker}
            >
              Close
            </button>
          </div>

          <div className="p-3 border-b border-slate-100">
            <input
              type="text"
              placeholder="Filter emoji..."
              value={emojiSearch}
              onChange={(event) => setEmojiSearch(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div className="max-h-[240px] overflow-y-auto p-2">
            <div className="grid grid-cols-8 gap-1">
              {filteredCalloutEmojis.map((option) => (
                <button
                  key={`${option.emoji}-${option.keywords[0]}`}
                  type="button"
                  className="h-9 w-9 rounded-lg text-xl hover:bg-slate-100 flex items-center justify-center"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applyCalloutEmoji(option.emoji)}
                  title={option.keywords.join(', ')}
                >
                  {option.emoji}
                </button>
              ))}
            </div>
            {filteredCalloutEmojis.length === 0 && (
              <div className="px-2 py-5 text-center text-sm text-slate-500">No emoji found</div>
            )}
          </div>

          <div className="px-3 py-2 border-t border-slate-100">
            <button
              type="button"
              className="text-xs text-slate-500 hover:text-slate-700"
              onClick={() => applyCalloutEmoji('\u{1F4A1}')}
            >
              Reset to default
            </button>
          </div>
        </div>
      )}

      {editable && isAiMenuOpen && (
        <div className="fixed inset-0 z-[110]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/35"
            onClick={closeAiMenu}
            aria-label="Close AI menu"
          />
          <div className="absolute left-1/2 bottom-4 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2">
            <div className="px-2 pb-2">
              <p className="text-base font-semibold text-slate-800">Bantuan AI</p>
              <p className="text-xs text-slate-500">Pilih aksi untuk teks yang kamu blok.</p>
            </div>
            <div className="space-y-1">
              {NOTE_AI_ACTION_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="w-full rounded-xl px-3 py-2.5 text-left hover:bg-slate-100 transition-colors disabled:opacity-60"
                  onClick={() => void runAiAction(item.id)}
                  disabled={isAiProcessing}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-lg leading-none">{item.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-800">{item.title}</span>
                      <span className="block text-xs text-slate-500">{item.description}</span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {editable && aiReview && (
        <div className="fixed inset-0 z-[115]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45"
            onClick={discardAiSuggestion}
            aria-label="Close AI review"
          />
          <div className="absolute left-1/2 top-1/2 w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
            <div className="mb-3">
              <p className="text-lg font-semibold text-slate-900">Tinjau Perubahan AI</p>
              <p className="text-xs text-slate-500">
                {NOTE_AI_ACTION_ITEMS.find((item) => item.id === aiReview.action)?.title || 'Bantuan AI'}
              </p>
            </div>

            {aiDiffPreview && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  +{aiDiffPreview.addedCount} bagian ditambahkan
                </span>
                <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                  -{aiDiffPreview.removedCount} bagian dihapus
                </span>
              </div>
            )}

            <div className="grid gap-3 max-h-[52vh] overflow-y-auto pr-1">
              <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sebelum</p>
                <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                  {(aiDiffPreview?.parts || []).map((part, index) => {
                    if (part.kind === 'added') return null;
                    return (
                      <span
                        key={`before-${index}`}
                        className={
                          part.kind === 'removed'
                            ? 'rounded bg-rose-200/80 text-rose-900'
                            : undefined
                        }
                      >
                        {part.text}
                      </span>
                    );
                  })}
                </div>
              </section>
              <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Usulan AI</p>
                <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">
                  {(aiDiffPreview?.parts || []).map((part, index) => {
                    if (part.kind === 'removed') return null;
                    return (
                      <span
                        key={`after-${index}`}
                        className={
                          part.kind === 'added'
                            ? 'rounded bg-emerald-200/80 text-emerald-900'
                            : undefined
                        }
                      >
                        {part.text}
                      </span>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                onClick={discardAiSuggestion}
              >
                Buang
              </button>
              <button
                type="button"
                className="rounded-lg bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
                onClick={applyAiSuggestion}
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {editable && isAiProcessing && (
        <div className="fixed inset-0 z-[120] pointer-events-none flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-xl bg-slate-900/90 px-4 py-2 text-sm font-medium text-white shadow-xl">
            <Loader2 size={16} className="animate-spin" />
            <span>Memproses bantuan AI...</span>
          </div>
        </div>
      )}

      {/* Selection Toolbar (only appears on text highlight) */}
      <NoteKeyboardToolbar
        editor={editor}
        isAiLoading={isAiProcessing}
        isImageUploading={isImageUploading}
        onAiTap={handleAiTap}
        onImageTap={handleImageTap}
      />
    </div>
  );
};

