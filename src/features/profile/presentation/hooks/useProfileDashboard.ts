'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BadgePreview,
  buildBadgePreview,
  PocketFolderSummary,
  ProfileStatsEntity,
  UserProfileEntity,
} from '@/features/profile/domain/entities/profile';
import { ProfileRepository } from '@/features/profile/data/repositories/profile_repository';

type DashboardState = {
  profile: UserProfileEntity | null;
  stats: ProfileStatsEntity | null;
  badgePreview: BadgePreview[];
  folders: PocketFolderSummary[];
  savedLinksCount: number;
};

const initialState: DashboardState = {
  profile: null,
  stats: null,
  badgePreview: [],
  folders: [],
  savedLinksCount: 0,
};

export const useProfileDashboard = (userId?: string) => {
  const repository = useMemo(() => new ProfileRepository(), []);
  const [state, setState] = useState<DashboardState>(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [profile, stats, unlockedBadgeIds, folders] = await Promise.all([
        repository.getProfile(userId),
        repository.getProfileStats(userId),
        repository.getUnlockedBadgeIds(userId),
        repository.getPocketFolders(userId),
      ]);

      setState({
        profile,
        stats,
        badgePreview: stats ? buildBadgePreview(stats, unlockedBadgeIds) : [],
        folders,
        savedLinksCount: folders.reduce((sum, folder) => sum + folder.itemCount, 0),
      });
    } catch (nextError) {
      console.error('Failed to load profile dashboard.', nextError);
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [repository, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateDisplayName = useCallback(
    async (displayName: string) => {
      if (!userId) return;

      try {
        setSaving(true);
        await repository.updateDisplayName(userId, displayName);
        await refresh();
      } finally {
        setSaving(false);
      }
    },
    [refresh, repository, userId]
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!userId) return;

      try {
        setSaving(true);
        await repository.uploadAvatar(userId, file);
        await refresh();
      } finally {
        setSaving(false);
      }
    },
    [refresh, repository, userId]
  );

  return {
    ...state,
    loading,
    saving,
    error,
    refresh,
    updateDisplayName,
    uploadAvatar,
  };
};
