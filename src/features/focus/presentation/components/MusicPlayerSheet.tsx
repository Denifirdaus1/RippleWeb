'use client';
/* eslint-disable @next/next/no-img-element */

import { Pause, Play, SkipForward, Volume1, Volume2, VolumeX } from 'lucide-react';
import { MusicTrack } from '@/features/focus/presentation/utils/musicLibrary';

interface MusicPlayerSheetProps {
  open: boolean;
  tracks: MusicTrack[];
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  volume: number;
  onClose: () => void;
  onPlayTrack: (track: MusicTrack) => Promise<void> | void;
  onTogglePlayPause: () => Promise<void> | void;
  onNext: () => Promise<void> | void;
  onVolumeChange: (volume: number) => void;
}

const VolumeIcon = ({ volume }: { volume: number }) => {
  if (volume === 0) {
    return <VolumeX size={18} className="text-rose-500" />;
  }

  if (volume < 0.5) {
    return <Volume1 size={18} className="text-slate-500" />;
  }

  return <Volume2 size={18} className="text-slate-500" />;
};

export function MusicPlayerSheet({
  open,
  tracks,
  currentTrack,
  isPlaying,
  volume,
  onClose,
  onPlayTrack,
  onTogglePlayPause,
  onNext,
  onVolumeChange,
}: MusicPlayerSheetProps) {
  if (!open) {
    return null;
  }

  const groupedTracks = {
    Nature: tracks.filter((track) => track.category === 'Nature'),
    'Lo-Fi': tracks.filter((track) => track.category === 'Lo-Fi'),
  };

  return (
    <div className="fixed inset-0 z-[85]">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/35"
        onClick={onClose}
        aria-label="Close music player"
      />

      <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] border border-slate-200 bg-white px-5 pb-6 pt-3 shadow-2xl sm:left-1/2 sm:bottom-6 sm:max-w-4xl sm:-translate-x-1/2 sm:rounded-[28px]">
        <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-slate-200" />
        <h2 className="px-1 text-2xl font-black tracking-tight text-slate-900">Focus Music</h2>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_1fr]">
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            {currentTrack ? (
              <>
                <div className="flex items-start gap-5">
                  <div
                    className={`flex h-24 w-24 items-center justify-center rounded-full border border-slate-200 bg-white p-4 shadow-sm ${
                      isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''
                    }`}
                  >
                    <img
                      src={currentTrack.iconPath}
                      alt={currentTrack.name}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xl font-black text-slate-900">{currentTrack.name}</p>
                    <p className="mt-1 text-sm font-medium text-slate-500">{currentTrack.category}</p>

                    <div className="mt-5 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => void onTogglePlayPause()}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFB74D] text-white shadow-lg shadow-orange-200/80 transition hover:brightness-105"
                      >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} className="translate-x-[1px]" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => void onNext()}
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                      >
                        <SkipForward size={20} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onVolumeChange(0)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
                  >
                    <VolumeIcon volume={volume} />
                  </button>
                  <span className="w-12 text-xs font-bold text-slate-500">
                    {Math.round(volume * 100)}%
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(event) => onVolumeChange(Number(event.target.value))}
                    className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-white accent-[#FFB74D]"
                  />
                </div>
              </>
            ) : (
              <div className="flex h-full min-h-56 items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-white px-6 text-center text-sm font-medium text-slate-500">
                Select a track to keep your focus steady.
              </div>
            )}
          </div>

          <div className="max-h-[54vh] overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-4">
            {(['Nature', 'Lo-Fi'] as const).map((category) => (
              <div key={category} className="mb-6 last:mb-0">
                <p className="px-2 text-sm font-bold tracking-wide text-slate-400">{category}</p>
                <div className="mt-3 space-y-2">
                  {groupedTracks[category].map((track) => {
                    const isSelected = currentTrack?.id === track.id;
                    return (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => void onPlayTrack(track)}
                        className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                          isSelected
                            ? 'border-[#FFB74D] bg-orange-50'
                            : 'border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white'
                        }`}
                      >
                        <img
                          src={track.iconPath}
                          alt={track.name}
                          className="h-12 w-12 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm font-bold ${isSelected ? 'text-[#FFB74D]' : 'text-slate-900'}`}>
                            {track.name}
                          </p>
                          <p className="text-xs font-medium text-slate-500">{track.category}</p>
                        </div>
                        {isSelected ? (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFB74D] text-white">
                            {isPlaying ? <Pause size={16} /> : <Play size={16} className="translate-x-[1px]" />}
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
