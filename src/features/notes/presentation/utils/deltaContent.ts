type JsonObject = Record<string, any>;

export interface QuillDeltaOp {
  insert: string | JsonObject;
  attributes?: JsonObject;
}

export interface QuillDelta {
  ops: QuillDeltaOp[];
}

interface TextSegment {
  kind: 'text';
  text: string;
  attrs: JsonObject;
}

interface EmbedSegment {
  kind: 'embed';
  insert: JsonObject;
  attrs: JsonObject;
}

type LineSegment = TextSegment | EmbedSegment;

interface DeltaLine {
  segments: LineSegment[];
  attrs: JsonObject;
}

export const RIPPLE_EMBED_NODE = 'rippleEmbed';
export const RIPPLE_IMAGE_NODE = 'rippleImage';
export const RIPPLE_CALLOUT_NODE = 'rippleCallout';
export const RIPPLE_SHARED_LINK_NODE = 'rippleSharedLink';

const CALLOUT_TONES = ['default', 'info', 'success', 'warning', 'danger'] as const;
type CalloutTone = (typeof CALLOUT_TONES)[number];

function parseCalloutTone(value: unknown): CalloutTone {
  if (typeof value !== 'string') return 'info';
  const normalized = value.trim().toLowerCase();
  if (CALLOUT_TONES.includes(normalized as CalloutTone)) {
    return normalized as CalloutTone;
  }
  return 'info';
}

function parseCalloutIcon(value: unknown): string {
  if (typeof value !== 'string') return '\u{1F4A1}';
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : '\u{1F4A1}';
}

const EMPTY_DELTA: QuillDelta = { ops: [{ insert: '\n' }] };

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneObject<T extends JsonObject>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function hasOwnKeys(value: JsonObject | undefined): value is JsonObject {
  return !!value && Object.keys(value).length > 0;
}

function parseJsonSafely(value: unknown): any {
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

interface SharedLinkData {
  rawPayload: string;
  url: string;
  host?: string;
  path?: string;
  title?: string;
  description?: string;
  authorName?: string;
  thumbnailUrl?: string;
  siteName?: string;
}

function compactHost(host: string): string {
  return host.replace(/^www\./i, '').trim();
}

function parseUrlMeta(url: string): { host?: string; path?: string } {
  try {
    const parsed = new URL(url);
    const host = compactHost(parsed.host || '');
    const path = parsed.pathname || '';
    return {
      ...(host ? { host } : {}),
      ...(path ? { path } : {}),
    };
  } catch {
    return {};
  }
}

function parseSharedLinkRaw(raw: unknown): SharedLinkData | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const decoded = parseJsonSafely(trimmed);
  if (isObject(decoded)) {
    const url = typeof decoded.url === 'string' ? decoded.url.trim() : '';
    if (!url) return null;

    const urlMeta = parseUrlMeta(url);
    const host =
      typeof decoded.host === 'string' && decoded.host.trim().length > 0
        ? compactHost(decoded.host)
        : urlMeta.host;
    const path =
      typeof decoded.path === 'string' && decoded.path.trim().length > 0
        ? decoded.path.trim()
        : urlMeta.path;
    const title =
      typeof decoded.title === 'string' && decoded.title.trim().length > 0
        ? decoded.title.trim()
        : undefined;
    const description =
      typeof decoded.description === 'string' && decoded.description.trim().length > 0
        ? decoded.description.trim()
        : undefined;
    const authorName =
      typeof decoded.author_name === 'string' && decoded.author_name.trim().length > 0
        ? decoded.author_name.trim()
        : typeof decoded.authorName === 'string' && decoded.authorName.trim().length > 0
          ? decoded.authorName.trim()
          : undefined;
    const thumbnailUrl =
      typeof decoded.thumbnail_url === 'string' && decoded.thumbnail_url.trim().length > 0
        ? decoded.thumbnail_url.trim()
        : typeof decoded.thumbnailUrl === 'string' && decoded.thumbnailUrl.trim().length > 0
          ? decoded.thumbnailUrl.trim()
          : undefined;
    const siteName =
      typeof decoded.site_name === 'string' && decoded.site_name.trim().length > 0
        ? decoded.site_name.trim()
        : typeof decoded.siteName === 'string' && decoded.siteName.trim().length > 0
          ? decoded.siteName.trim()
          : undefined;

    const payload = JSON.stringify({
      url,
      ...(host ? { host } : {}),
      ...(path ? { path } : {}),
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(authorName ? { author_name: authorName } : {}),
      ...(thumbnailUrl ? { thumbnail_url: thumbnailUrl } : {}),
      ...(siteName ? { site_name: siteName } : {}),
    });

    return {
      rawPayload: payload,
      url,
      host,
      path,
      title,
      description,
      authorName,
      thumbnailUrl,
      siteName,
    };
  }

  const url = trimmed;
  const urlMeta = parseUrlMeta(url);
  const payload = JSON.stringify({
    url,
    ...(urlMeta.host ? { host: urlMeta.host } : {}),
    ...(urlMeta.path ? { path: urlMeta.path } : {}),
  });

  return {
    rawPayload: payload,
    url,
    host: urlMeta.host,
    path: urlMeta.path,
    title: undefined,
    description: undefined,
    authorName: undefined,
    thumbnailUrl: undefined,
    siteName: undefined,
  };
}

function parseSharedLinkFromInsert(insert: JsonObject): SharedLinkData | null {
  if (typeof insert.shared_link === 'string') {
    return parseSharedLinkRaw(insert.shared_link);
  }

  if (typeof insert.custom === 'string') {
    const customPayload = parseJsonSafely(insert.custom);
    if (isObject(customPayload) && typeof customPayload.shared_link === 'string') {
      return parseSharedLinkRaw(customPayload.shared_link);
    }
  }

  return null;
}

function cleanAttributes(attrs: unknown): JsonObject {
  if (!isObject(attrs)) return {};
  const next = { ...attrs };
  Object.keys(next).forEach((key) => {
    if (next[key] === undefined || next[key] === null || next[key] === false) {
      delete next[key];
    }
  });
  return next;
}

function attributesEqual(a?: JsonObject, b?: JsonObject): boolean {
  if (!hasOwnKeys(a || {}) && !hasOwnKeys(b || {})) return true;
  return JSON.stringify(a || {}) === JSON.stringify(b || {});
}

function normalizeDeltaOps(ops: QuillDeltaOp[]): QuillDeltaOp[] {
  const normalized: QuillDeltaOp[] = [];

  for (const op of ops) {
    if (!op) continue;

    const attrs = cleanAttributes(op.attributes);
    const nextOp: QuillDeltaOp = hasOwnKeys(attrs)
      ? { insert: op.insert, attributes: attrs }
      : { insert: op.insert };

    if (typeof nextOp.insert === 'string' && nextOp.insert.length === 0) {
      continue;
    }

    const prev = normalized[normalized.length - 1];
    if (
      prev &&
      typeof prev.insert === 'string' &&
      typeof nextOp.insert === 'string' &&
      attributesEqual(prev.attributes, nextOp.attributes)
    ) {
      prev.insert += nextOp.insert;
      continue;
    }

    normalized.push(nextOp);
  }

  if (normalized.length === 0) return cloneObject(EMPTY_DELTA).ops;
  return normalized;
}

function ensureTrailingNewline(ops: QuillDeltaOp[]): QuillDeltaOp[] {
  if (ops.length === 0) return cloneObject(EMPTY_DELTA).ops;

  const last = ops[ops.length - 1];
  if (typeof last.insert === 'string') {
    if (!last.insert.endsWith('\n')) {
      ops.push({ insert: '\n' });
    }
  } else {
    ops.push({ insert: '\n' });
  }

  return ops;
}

function normalizeLegacyBlocks(content: JsonObject): QuillDelta {
  if (!Array.isArray(content.blocks)) return cloneObject(EMPTY_DELTA);

  const lines = content.blocks
    .map((block: any) => (typeof block?.text === 'string' ? block.text : ''))
    .filter((line: string) => line.length > 0);

  if (lines.length === 0) return cloneObject(EMPTY_DELTA);

  return {
    ops: [{ insert: `${lines.join('\n')}\n` }],
  };
}

function normalizeEmbedInsert(insert: unknown): JsonObject | null {
  return isObject(insert) ? cloneObject(insert) : null;
}

export function isDeltaJson(content: unknown): content is QuillDelta {
  return isObject(content) && Array.isArray((content as any).ops);
}

export function isTipTapJson(content: unknown): boolean {
  return isObject(content) && (content as any).type === 'doc';
}

export function normalizeToDelta(content: unknown): QuillDelta {
  if (isDeltaJson(content)) {
    const ops = Array.isArray(content.ops) ? content.ops : [];
    const normalizedOps = ops
      .map((raw): QuillDeltaOp | null => {
        if (!isObject(raw) || raw.insert === undefined) return null;
        const attrs = cleanAttributes(raw.attributes);
        if (typeof raw.insert === 'string') {
          return hasOwnKeys(attrs)
            ? { insert: raw.insert, attributes: attrs }
            : { insert: raw.insert };
        }
        const embedInsert = normalizeEmbedInsert(raw.insert);
        if (!embedInsert) return null;
        return hasOwnKeys(attrs)
          ? { insert: embedInsert, attributes: attrs }
          : { insert: embedInsert };
      })
      .filter((op): op is QuillDeltaOp => op !== null);

    const merged = normalizeDeltaOps(normalizedOps);
    return { ops: ensureTrailingNewline(merged) };
  }

  if (isTipTapJson(content)) {
    return tipTapDocToDelta(content);
  }

  if (isObject(content) && Array.isArray((content as any).blocks)) {
    return normalizeLegacyBlocks(content);
  }

  if (typeof content === 'string' && content.trim().length > 0) {
    return { ops: [{ insert: `${content}\n` }] };
  }

  return cloneObject(EMPTY_DELTA);
}

function parseDeltaLines(delta: QuillDelta): DeltaLine[] {
  const lines: DeltaLine[] = [];
  let currentSegments: LineSegment[] = [];

  const pushLine = (attrs: JsonObject) => {
    lines.push({ segments: currentSegments, attrs: cleanAttributes(attrs) });
    currentSegments = [];
  };

  for (const op of delta.ops) {
    if (typeof op.insert === 'string') {
      let remaining = op.insert;
      const attrs = cleanAttributes(op.attributes);

      while (remaining.length > 0) {
        const newlineIndex = remaining.indexOf('\n');

        if (newlineIndex === -1) {
          currentSegments.push({ kind: 'text', text: remaining, attrs });
          remaining = '';
          continue;
        }

        const beforeNewline = remaining.slice(0, newlineIndex);
        if (beforeNewline.length > 0) {
          currentSegments.push({ kind: 'text', text: beforeNewline, attrs });
        }
        pushLine(attrs);
        remaining = remaining.slice(newlineIndex + 1);
      }
    } else {
      const embedInsert = normalizeEmbedInsert(op.insert);
      if (!embedInsert) continue;
      currentSegments.push({
        kind: 'embed',
        insert: embedInsert,
        attrs: cleanAttributes(op.attributes),
      });
    }
  }

  if (currentSegments.length > 0) {
    lines.push({ segments: currentSegments, attrs: {} });
  }

  if (lines.length === 0) {
    lines.push({ segments: [], attrs: {} });
  }

  return lines;
}

function toMarkNodes(attrs: JsonObject): any[] {
  const marks: any[] = [];

  if (attrs.bold) marks.push({ type: 'bold' });
  if (attrs.italic) marks.push({ type: 'italic' });
  if (attrs.strike) marks.push({ type: 'strike' });
  if (attrs.underline) marks.push({ type: 'underline' });
  if (attrs.code) marks.push({ type: 'code' });
  if (typeof attrs.link === 'string' && attrs.link.trim().length > 0) {
    marks.push({ type: 'link', attrs: { href: attrs.link.trim() } });
  }

  return marks;
}

function buildEmbedLabel(insert: JsonObject): string {
  if (typeof insert.image === 'string') {
    return '[Image]';
  }

  const sharedLink = parseSharedLinkFromInsert(insert);
  if (sharedLink) {
    return sharedLink.host ? `[Link] ${sharedLink.host}` : '[Link]';
  }

  if (typeof insert.custom === 'string') {
    const customPayload = parseJsonSafely(insert.custom);
    if (isObject(customPayload) && customPayload.todo_item) {
      const todoPayload = parseJsonSafely(customPayload.todo_item);
      if (isObject(todoPayload) && typeof todoPayload.title === 'string') {
        return `[Todo] ${todoPayload.title}`;
      }
      return '[Todo]';
    }

    if (isObject(customPayload) && customPayload.shared_link) {
      return '[Link]';
    }

    return '[Embed]';
  }

  const keys = Object.keys(insert);
  if (keys.length === 0) return '[Embed]';
  return `[Embed:${keys[0]}]`;
}

function hasStructuralLineAttributes(attrs: JsonObject): boolean {
  return (
    attrs.header !== undefined ||
    attrs.list !== undefined ||
    attrs.blockquote !== undefined ||
    attrs['code-block'] !== undefined ||
    attrs.callout !== undefined ||
    attrs.callout_tone !== undefined ||
    attrs.callout_icon !== undefined
  );
}

function buildSharedLinkNode(segment: EmbedSegment): any | null {
  const parsed = parseSharedLinkFromInsert(segment.insert);
  if (!parsed || !parsed.url) return null;

  const payload: JsonObject = {
    insert: {
      shared_link: parsed.rawPayload,
    },
  };

  if (hasOwnKeys(segment.attrs)) {
    payload.attributes = segment.attrs;
  }

  return {
    type: RIPPLE_SHARED_LINK_NODE,
    attrs: {
      payload: JSON.stringify(payload),
      url: parsed.url,
      host: parsed.host || '',
      path: parsed.path || '',
      title: parsed.title || '',
      description: parsed.description || '',
      authorName: parsed.authorName || '',
      thumbnailUrl: parsed.thumbnailUrl || '',
      siteName: parsed.siteName || '',
    },
  };
}

function segmentToInlineNode(segment: LineSegment): any | null {
  if (segment.kind === 'text') {
    if (!segment.text) return null;
    const textNode: any = { type: 'text', text: segment.text };
    const marks = toMarkNodes(segment.attrs);
    if (marks.length > 0) {
      textNode.marks = marks;
    }
    return textNode;
  }

  const payload: JsonObject = { insert: segment.insert };
  if (hasOwnKeys(segment.attrs)) {
    payload.attributes = segment.attrs;
  }

  if (typeof segment.insert.image === 'string' && segment.insert.image.trim().length > 0) {
    return {
      type: RIPPLE_IMAGE_NODE,
      attrs: {
        src: segment.insert.image.trim(),
        payload: JSON.stringify(payload),
        styleRaw: typeof segment.attrs.style === 'string' ? segment.attrs.style : '',
      },
    };
  }

  return {
    type: RIPPLE_EMBED_NODE,
    attrs: {
      payload: JSON.stringify(payload),
      label: buildEmbedLabel(segment.insert),
    },
  };
}

function segmentsToInlineNodes(segments: LineSegment[]): any[] {
  return segments
    .map(segmentToInlineNode)
    .filter((node): node is any => node !== null);
}

function parseHeaderLevel(value: unknown): number | null {
  const level = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(level)) return null;
  if (level < 1 || level > 6) return null;
  return level;
}

function parseTextAlign(value: unknown): 'left' | 'center' | 'right' | 'justify' | null {
  if (value === 'left' || value === 'center' || value === 'right' || value === 'justify') {
    return value;
  }
  return null;
}

function buildParagraphNode(segments: LineSegment[], attrs: JsonObject): any {
  const content = segmentsToInlineNodes(segments);
  const textAlign = parseTextAlign(attrs.align);
  const node: any = { type: 'paragraph' };

  if (textAlign) {
    node.attrs = { textAlign };
  }

  if (content.length > 0) {
    node.content = content;
  }

  return node;
}

function buildCodeBlockNode(segments: LineSegment[]): any {
  const contentText = segments
    .map((segment) => (segment.kind === 'text' ? segment.text : buildEmbedLabel(segment.insert)))
    .join('');

  return contentText.length > 0
    ? { type: 'codeBlock', content: [{ type: 'text', text: contentText }] }
    : { type: 'codeBlock' };
}

function buildStandardBlockNode(line: DeltaLine): any {
  if (!hasStructuralLineAttributes(line.attrs) && line.segments.length === 1) {
    const first = line.segments[0];
    if (first.kind === 'embed') {
      const sharedLinkNode = buildSharedLinkNode(first);
      if (sharedLinkNode) return sharedLinkNode;
    }
  }

  const headerLevel = parseHeaderLevel(line.attrs.header);
  if (headerLevel) {
    const heading: any = {
      type: 'heading',
      attrs: { level: headerLevel },
    };
    const align = parseTextAlign(line.attrs.align);
    if (align) {
      heading.attrs.textAlign = align;
    }
    const inlineContent = segmentsToInlineNodes(line.segments);
    if (inlineContent.length > 0) {
      heading.content = inlineContent;
    }
    return heading;
  }

  if (line.attrs.blockquote) {
    return {
      type: 'blockquote',
      content: [buildParagraphNode(line.segments, line.attrs)],
    };
  }

  if (line.attrs['code-block']) {
    return buildCodeBlockNode(line.segments);
  }

  return buildParagraphNode(line.segments, line.attrs);
}

function buildListItem(type: 'bullet' | 'ordered' | 'task', line: DeltaLine): any {
  const paragraph = buildParagraphNode(line.segments, line.attrs);
  if (type === 'task') {
    return {
      type: 'taskItem',
      attrs: { checked: line.attrs.list === 'checked' },
      content: [paragraph],
    };
  }
  return { type: 'listItem', content: [paragraph] };
}

export function deltaToTipTapDoc(deltaInput: unknown): any {
  const delta = normalizeToDelta(deltaInput);
  const lines = parseDeltaLines(delta);
  const content: any[] = [];

  let activeListType: 'bullet' | 'ordered' | 'task' | null = null;
  let activeItems: any[] = [];
  let activeCallout: { tone: CalloutTone; icon: string; blocks: any[] } | null = null;

  const flushList = () => {
    if (!activeListType) return;
    const listType =
      activeListType === 'bullet'
        ? 'bulletList'
        : activeListType === 'ordered'
          ? 'orderedList'
          : 'taskList';
    content.push({ type: listType, content: activeItems });
    activeListType = null;
    activeItems = [];
  };

  const flushCallout = () => {
    if (!activeCallout) return;
    content.push({
      type: RIPPLE_CALLOUT_NODE,
      attrs: {
        tone: activeCallout.tone,
        icon: activeCallout.icon,
      },
      content: activeCallout.blocks.length > 0 ? activeCallout.blocks : [{ type: 'paragraph' }],
    });
    activeCallout = null;
  };

  for (const line of lines) {
    const isCalloutLine =
      !!line.attrs.callout ||
      typeof line.attrs.callout_tone === 'string' ||
      typeof line.attrs.callout_icon === 'string';

    if (isCalloutLine) {
      flushList();
      const tone = parseCalloutTone(line.attrs.callout_tone);
      const icon = parseCalloutIcon(line.attrs.callout_icon);
      const paragraph = buildParagraphNode(line.segments, line.attrs);

      if (!activeCallout || activeCallout.tone !== tone || activeCallout.icon !== icon) {
        flushCallout();
        activeCallout = { tone, icon, blocks: [paragraph] };
      } else {
        activeCallout.blocks.push(paragraph);
      }
      continue;
    }

    flushCallout();

    const listAttr = line.attrs.list;
    const listType: 'bullet' | 'ordered' | 'task' | null =
      listAttr === 'bullet'
        ? 'bullet'
        : listAttr === 'ordered'
          ? 'ordered'
          : listAttr === 'checked' || listAttr === 'unchecked'
            ? 'task'
            : null;

    if (listType) {
      if (activeListType !== listType) {
        flushList();
        activeListType = listType;
      }
      activeItems.push(buildListItem(listType, line));
      continue;
    }

    flushList();
    content.push(buildStandardBlockNode(line));
  }

  flushList();
  flushCallout();

  if (content.length === 0) {
    content.push({ type: 'paragraph' });
  }

  return { type: 'doc', content };
}

function marksToAttributes(marks: any[] | undefined): JsonObject {
  const attrs: JsonObject = {};
  if (!Array.isArray(marks)) return attrs;

  for (const mark of marks) {
    if (!isObject(mark)) continue;
    switch (mark.type) {
      case 'bold':
        attrs.bold = true;
        break;
      case 'italic':
        attrs.italic = true;
        break;
      case 'strike':
        attrs.strike = true;
        break;
      case 'underline':
        attrs.underline = true;
        break;
      case 'code':
        attrs.code = true;
        break;
      case 'link':
        if (typeof mark.attrs?.href === 'string' && mark.attrs.href.trim().length > 0) {
          attrs.link = mark.attrs.href.trim();
        }
        break;
      default:
        break;
    }
  }

  return attrs;
}

function parseEmbedPayload(payload: unknown): { insert: JsonObject; attributes?: JsonObject } | null {
  const parsed = parseJsonSafely(payload);
  if (!isObject(parsed)) return null;
  if (!isObject(parsed.insert)) return null;

  const result: { insert: JsonObject; attributes?: JsonObject } = {
    insert: cloneObject(parsed.insert),
  };

  if (isObject(parsed.attributes)) {
    const cleaned = cleanAttributes(parsed.attributes);
    if (hasOwnKeys(cleaned)) {
      result.attributes = cleaned;
    }
  }

  return result;
}

function buildImageOpFromNode(node: any): QuillDeltaOp | null {
  const payload = parseEmbedPayload(node?.attrs?.payload);
  const srcFromNode = typeof node?.attrs?.src === 'string' ? node.attrs.src.trim() : '';
  const srcFromPayload =
    payload && typeof payload.insert?.image === 'string' ? payload.insert.image.trim() : '';
  const src = srcFromNode || srcFromPayload;
  if (!src) return null;

  const styleFromNode =
    typeof node?.attrs?.styleRaw === 'string' ? node.attrs.styleRaw.trim() : '';
  const payloadAttrs = payload?.attributes ? cleanAttributes(payload.attributes) : {};
  const styleFromPayload =
    typeof payloadAttrs.style === 'string' ? payloadAttrs.style.trim() : '';
  const style = styleFromNode || styleFromPayload;

  const mergedAttrs: JsonObject = { ...payloadAttrs };
  delete mergedAttrs.style;
  if (style.length > 0) {
    mergedAttrs.style = style;
  }

  return hasOwnKeys(mergedAttrs)
    ? { insert: { image: src }, attributes: mergedAttrs }
    : { insert: { image: src } };
}

function buildSharedLinkOpFromNode(node: any): QuillDeltaOp | null {
  const payload = parseEmbedPayload(node?.attrs?.payload);
  if (payload) {
    const parsedFromPayload = parseSharedLinkFromInsert(payload.insert);
    if (parsedFromPayload) {
      const insert = { shared_link: parsedFromPayload.rawPayload };
      return payload.attributes && hasOwnKeys(payload.attributes)
        ? { insert, attributes: payload.attributes }
        : { insert };
    }
  }

  const url = typeof node?.attrs?.url === 'string' ? node.attrs.url.trim() : '';
  if (!url) return null;

  const hostRaw = typeof node?.attrs?.host === 'string' ? node.attrs.host.trim() : '';
  const pathRaw = typeof node?.attrs?.path === 'string' ? node.attrs.path.trim() : '';
  const titleRaw = typeof node?.attrs?.title === 'string' ? node.attrs.title.trim() : '';
  const descriptionRaw = typeof node?.attrs?.description === 'string' ? node.attrs.description.trim() : '';
  const authorNameRaw = typeof node?.attrs?.authorName === 'string' ? node.attrs.authorName.trim() : '';
  const thumbnailUrlRaw =
    typeof node?.attrs?.thumbnailUrl === 'string' ? node.attrs.thumbnailUrl.trim() : '';
  const siteNameRaw = typeof node?.attrs?.siteName === 'string' ? node.attrs.siteName.trim() : '';
  const urlMeta = parseUrlMeta(url);
  const host = hostRaw || urlMeta.host;
  const path = pathRaw || urlMeta.path;

  const sharedPayload = JSON.stringify({
    url,
    ...(host ? { host: compactHost(host) } : {}),
    ...(path ? { path } : {}),
    ...(titleRaw ? { title: titleRaw } : {}),
    ...(descriptionRaw ? { description: descriptionRaw } : {}),
    ...(authorNameRaw ? { author_name: authorNameRaw } : {}),
    ...(thumbnailUrlRaw ? { thumbnail_url: thumbnailUrlRaw } : {}),
    ...(siteNameRaw ? { site_name: siteNameRaw } : {}),
  });

  return {
    insert: {
      shared_link: sharedPayload,
    },
  };
}

function pushInlineOps(content: any[] | undefined, bucket: QuillDeltaOp[]) {
  if (!Array.isArray(content)) return;

  for (const node of content) {
    if (!isObject(node)) continue;

    if (node.type === 'text') {
      if (typeof node.text !== 'string' || node.text.length === 0) continue;
      const attrs = marksToAttributes(Array.isArray(node.marks) ? node.marks : undefined);
      bucket.push(
        hasOwnKeys(attrs)
          ? { insert: node.text, attributes: attrs }
          : { insert: node.text },
      );
      continue;
    }

    if (node.type === 'hardBreak') {
      bucket.push({ insert: '\n' });
      continue;
    }

    if (node.type === RIPPLE_EMBED_NODE) {
      const embed = parseEmbedPayload(node.attrs?.payload);
      if (embed) {
        bucket.push(embed.attributes ? embed : { insert: embed.insert });
      }
      continue;
    }

    if (node.type === RIPPLE_IMAGE_NODE) {
      const imageOp = buildImageOpFromNode(node);
      if (imageOp) {
        bucket.push(imageOp);
      }
      continue;
    }

    if (node.type === RIPPLE_SHARED_LINK_NODE) {
      const sharedLinkOp = buildSharedLinkOpFromNode(node);
      if (sharedLinkOp) {
        bucket.push(sharedLinkOp);
      }
      continue;
    }

    if (Array.isArray(node.content)) {
      pushInlineOps(node.content, bucket);
    }
  }
}

function extractParagraphNode(item: any): any | null {
  if (!isObject(item)) return null;
  if (!Array.isArray(item.content)) return null;
  const paragraph = item.content.find((child: any) => isObject(child) && child.type === 'paragraph');
  if (paragraph && isObject(paragraph)) return paragraph;
  const first = item.content[0];
  return isObject(first) ? first : null;
}

function pushBlockNewline(ops: QuillDeltaOp[], attrs: JsonObject = {}) {
  const cleaned = cleanAttributes(attrs);
  ops.push(hasOwnKeys(cleaned) ? { insert: '\n', attributes: cleaned } : { insert: '\n' });
}

function textAlignToQuill(value: unknown): 'left' | 'center' | 'right' | 'justify' | null {
  return parseTextAlign(value);
}

export function tipTapDocToDelta(doc: unknown): QuillDelta {
  if (!isObject(doc) || doc.type !== 'doc') {
    return cloneObject(EMPTY_DELTA);
  }

  const rootContent = Array.isArray(doc.content) ? doc.content : [];
  const ops: QuillDeltaOp[] = [];

  for (const block of rootContent) {
    if (!isObject(block)) continue;

    if (block.type === 'paragraph') {
      pushInlineOps(block.content, ops);
      const attrs: JsonObject = {};
      const textAlign = textAlignToQuill(block.attrs?.textAlign);
      if (textAlign && textAlign !== 'left') attrs.align = textAlign;
      pushBlockNewline(ops, attrs);
      continue;
    }

    if (block.type === 'heading') {
      pushInlineOps(block.content, ops);
      const attrs: JsonObject = {};
      const level = Number(block.attrs?.level);
      attrs.header = Number.isFinite(level) ? level : 1;
      const textAlign = textAlignToQuill(block.attrs?.textAlign);
      if (textAlign && textAlign !== 'left') attrs.align = textAlign;
      pushBlockNewline(ops, attrs);
      continue;
    }

    if (block.type === 'blockquote') {
      const paragraph = extractParagraphNode(block);
      pushInlineOps(paragraph?.content, ops);
      pushBlockNewline(ops, { blockquote: true });
      continue;
    }

    if (block.type === 'codeBlock') {
      pushInlineOps(block.content, ops);
      pushBlockNewline(ops, { 'code-block': true });
      continue;
    }

    if (block.type === 'bulletList' || block.type === 'orderedList') {
      const listItems = Array.isArray(block.content) ? block.content : [];
      const listValue = block.type === 'bulletList' ? 'bullet' : 'ordered';
      for (const item of listItems) {
        const paragraph = extractParagraphNode(item);
        pushInlineOps(paragraph?.content, ops);
        const attrs: JsonObject = { list: listValue };
        const textAlign = textAlignToQuill(paragraph?.attrs?.textAlign);
        if (textAlign && textAlign !== 'left') attrs.align = textAlign;
        pushBlockNewline(ops, attrs);
      }
      continue;
    }

    if (block.type === 'taskList') {
      const taskItems = Array.isArray(block.content) ? block.content : [];
      for (const item of taskItems) {
        const paragraph = extractParagraphNode(item);
        pushInlineOps(paragraph?.content, ops);
        const attrs: JsonObject = {
          list: item?.attrs?.checked ? 'checked' : 'unchecked',
        };
        const textAlign = textAlignToQuill(paragraph?.attrs?.textAlign);
        if (textAlign && textAlign !== 'left') attrs.align = textAlign;
        pushBlockNewline(ops, attrs);
      }
      continue;
    }

    if (block.type === RIPPLE_CALLOUT_NODE) {
      const tone = parseCalloutTone(block.attrs?.tone);
      const icon = parseCalloutIcon(block.attrs?.icon);
      const blocks = Array.isArray(block.content) && block.content.length > 0
        ? block.content
        : [{ type: 'paragraph' }];

      for (const calloutBlock of blocks) {
        if (!isObject(calloutBlock)) continue;

        if (Array.isArray(calloutBlock.content)) {
          pushInlineOps(calloutBlock.content, ops);
        }

        const attrs: JsonObject = {
          blockquote: true,
          callout: true,
          callout_tone: tone,
          callout_icon: icon,
        };

        const textAlign = textAlignToQuill(calloutBlock.attrs?.textAlign);
        if (textAlign && textAlign !== 'left') attrs.align = textAlign;

        pushBlockNewline(ops, attrs);
      }
      continue;
    }

    if (block.type === RIPPLE_EMBED_NODE) {
      const embed = parseEmbedPayload(block.attrs?.payload);
      if (embed) {
        ops.push(embed.attributes ? embed : { insert: embed.insert });
      }
      continue;
    }

    if (block.type === RIPPLE_SHARED_LINK_NODE) {
      const sharedLinkOp = buildSharedLinkOpFromNode(block);
      if (sharedLinkOp) {
        ops.push(sharedLinkOp);
        pushBlockNewline(ops);
      }
      continue;
    }

    if (block.type === RIPPLE_IMAGE_NODE) {
      const imageOp = buildImageOpFromNode(block);
      if (imageOp) {
        ops.push(imageOp);
        pushBlockNewline(ops);
      }
      continue;
    }

    if (Array.isArray(block.content)) {
      pushInlineOps(block.content, ops);
      pushBlockNewline(ops);
    }
  }

  const merged = normalizeDeltaOps(ops);
  return { ops: ensureTrailingNewline(merged) };
}

export function extractDescriptionFromContent(content: unknown, maxLength = 150): string {
  const delta = normalizeToDelta(content);
  let text = '';

  for (const op of delta.ops) {
    if (typeof op.insert === 'string') {
      text += op.insert;
      continue;
    }
    text += ` ${buildEmbedLabel(op.insert)} `;
  }

  return text.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}
