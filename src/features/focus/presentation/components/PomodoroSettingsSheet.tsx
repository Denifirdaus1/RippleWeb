'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  Armchair,
  Brain,
  Clock3,
  Coffee,
  RefreshCw,
} from 'lucide-react';
import { PomodoroSettings } from '@/features/focus/domain/entities/pomodoroSettings';

interface PomodoroSettingsSheetProps {
  open: boolean;
  settings: PomodoroSettings;
  saving?: boolean;
  onClose: () => void;
  onSave: (settings: PomodoroSettings) => Promise<void> | void;
}

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  color: string;
  icon: ReactNode;
  onChange: (value: number) => void;
}

function SliderField({
  label,
  value,
  min,
  max,
  unit,
  color,
  icon,
  onChange,
}: SliderFieldProps) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}1A`, color }}
        >
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">{label}</p>
        </div>
        <span className="text-sm font-bold text-slate-900">
          {value} {unit}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-100 accent-[var(--primary)]"
        style={{ accentColor: color }}
      />
    </div>
  );
}

function SwitchField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-4">
      <span className="flex-1 text-sm font-medium text-slate-900">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition-colors ${
          checked ? 'bg-[#FFB74D]' : 'bg-slate-200'
        }`}
        aria-pressed={checked}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </label>
  );
}

export function PomodoroSettingsSheet({
  open,
  settings,
  saving = false,
  onClose,
  onSave,
}: PomodoroSettingsSheetProps) {
  const [draft, setDraft] = useState(settings);

  useEffect(() => {
    if (open) {
      setDraft(settings);
    }
  }, [open, settings]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/35"
        onClick={onClose}
        aria-label="Close timer settings"
      />

      <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] border border-slate-200 bg-white px-6 pb-8 pt-3 shadow-2xl sm:left-1/2 sm:bottom-6 sm:max-w-2xl sm:-translate-x-1/2 sm:rounded-[28px]">
        <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-slate-200" />

        <div className="max-h-[75vh] overflow-y-auto pb-2">
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Timer Settings</h2>

          <div className="mt-8 space-y-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">
                Durations
              </p>
              <div className="mt-4 space-y-6">
                <SliderField
                  label="Focus Duration"
                  value={draft.focusDuration}
                  min={5}
                  max={60}
                  unit="min"
                  color="#FFB74D"
                  icon={<Brain size={18} />}
                  onChange={(value) => setDraft((current) => ({ ...current, focusDuration: value }))}
                />
                <SliderField
                  label="Short Break"
                  value={draft.shortBreakDuration}
                  min={1}
                  max={15}
                  unit="min"
                  color="#B4D8F6"
                  icon={<Coffee size={18} />}
                  onChange={(value) =>
                    setDraft((current) => ({ ...current, shortBreakDuration: value }))
                  }
                />
                <SliderField
                  label="Long Break"
                  value={draft.longBreakDuration}
                  min={10}
                  max={45}
                  unit="min"
                  color="#81C784"
                  icon={<Armchair size={18} />}
                  onChange={(value) =>
                    setDraft((current) => ({ ...current, longBreakDuration: value }))
                  }
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">
                Sessions & Behavior
              </p>
              <div className="mt-4 space-y-6">
                <SliderField
                  label="Sessions per Cycle"
                  value={draft.sessionsBeforeLongBreak}
                  min={2}
                  max={8}
                  unit="sessions"
                  color="#64748B"
                  icon={<RefreshCw size={18} />}
                  onChange={(value) =>
                    setDraft((current) => ({ ...current, sessionsBeforeLongBreak: value }))
                  }
                />
                <SwitchField
                  label="Auto-start Breaks"
                  checked={draft.autoStartBreaks}
                  onChange={(value) => setDraft((current) => ({ ...current, autoStartBreaks: value }))}
                />
                <SwitchField
                  label="Auto-start Focus"
                  checked={draft.autoStartFocus}
                  onChange={(value) => setDraft((current) => ({ ...current, autoStartFocus: value }))}
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            try {
              await onSave(draft);
              onClose();
            } catch {
              // Keep the sheet open so the user can retry.
            }
          }}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FFB74D] px-5 py-4 text-sm font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Clock3 size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
