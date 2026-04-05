'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FocusRepository } from '@/features/focus/data/repositories/focus_repository';
import { PomodoroRepository } from '@/features/focus/data/repositories/pomodoro_repository';
import {
  DEFAULT_POMODORO_SETTINGS,
  PomodoroSettings,
} from '@/features/focus/domain/entities/pomodoroSettings';

export const useFocusSetup = (userId?: string) => {
  const focusRepository = useMemo(() => new FocusRepository(), []);
  const pomodoroRepository = useMemo(() => new PomodoroRepository(), []);

  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_POMODORO_SETTINGS);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [completedMinutes, setCompletedMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!userId) {
      setSettings(DEFAULT_POMODORO_SETTINGS);
      setCompletedSessions(0);
      setCompletedMinutes(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [nextSettings, nextCompletedSessions, nextCompletedMinutes] = await Promise.all([
        pomodoroRepository.getSettings(userId),
        focusRepository.getTodayCompletedCount(userId),
        focusRepository.getTodayFocusMinutes(userId),
      ]);

      setSettings(nextSettings);
      setCompletedSessions(nextCompletedSessions);
      setCompletedMinutes(nextCompletedMinutes);
    } catch (nextError) {
      console.error('Failed to load focus setup data.', nextError);
      setError('Failed to load focus settings.');
    } finally {
      setLoading(false);
    }
  }, [focusRepository, pomodoroRepository, userId]);

  const saveSettings = useCallback(
    async (nextSettings: PomodoroSettings) => {
      try {
        setSaving(true);
        setError(null);
        await pomodoroRepository.saveSettings(userId, nextSettings);
        setSettings(nextSettings);
      } catch (nextError) {
        console.error('Failed to save focus settings.', nextError);
        const message = 'Failed to save timer settings.';
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [pomodoroRepository, userId]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return {
    settings,
    completedSessions,
    completedMinutes,
    loading,
    saving,
    error,
    reload: loadData,
    saveSettings,
  };
};
