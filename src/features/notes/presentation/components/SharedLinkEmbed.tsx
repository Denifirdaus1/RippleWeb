'use client';

import React from 'react';
import { Link2 } from 'lucide-react';

interface SharedLinkEmbedProps {
  url: string;
  host?: string;
  path?: string;
}

export const SharedLinkEmbed: React.FC<SharedLinkEmbedProps> = ({ url, host, path }) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="my-4 p-3 bg-[#F6F7FB] border border-[#E1E5EF] rounded-xl flex items-center gap-3 hover:bg-[#EFF1F8] transition-colors group no-underline"
    >
      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[var(--primary)] shadow-sm">
        <Link2 size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-slate-800 truncate">{host || 'Shared link'}</h4>
        <p className="text-[11px] text-slate-500 truncate">{path || url}</p>
      </div>
    </a>
  );
};
