'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PocketFolderSummary, SavedContentItem } from '@/features/profile/domain/entities/profile';
import { ProfileRepository } from '@/features/profile/data/repositories/profile_repository';

export const usePocketData = (userId?: string) => {
  const repository = useMemo(() => new ProfileRepository(), []);
  const [folders, setFolders] = useState<PocketFolderSummary[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [contents, setContents] = useState<SavedContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const nextFolders = await repository.getPocketFolders(userId);
      const nextSelectedFolderId =
        selectedFolderId && nextFolders.some((folder) => folder.id === selectedFolderId)
          ? selectedFolderId
          : nextFolders[0]?.id ?? null;
      const nextContents = nextSelectedFolderId
        ? await repository.getSavedContents(userId, nextSelectedFolderId)
        : [];

      setFolders(nextFolders);
      setSelectedFolderId(nextSelectedFolderId);
      setContents(nextContents);
    } catch (nextError) {
      console.error('Failed to load Ripple Links.', nextError);
      setError('Failed to load Ripple Links.');
    } finally {
      setLoading(false);
    }
  }, [repository, selectedFolderId, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectFolder = useCallback(
    async (folderId: string) => {
      if (!userId) return;

      try {
        setLoading(true);
        setSelectedFolderId(folderId);
        setContents(await repository.getSavedContents(userId, folderId));
      } catch (nextError) {
        console.error('Failed to load folder contents.', nextError);
        setError('Failed to load folder contents.');
      } finally {
        setLoading(false);
      }
    },
    [repository, userId]
  );

  return {
    folders,
    selectedFolderId,
    contents,
    loading,
    error,
    refresh,
    selectFolder,
  };
};
