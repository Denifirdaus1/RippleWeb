'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProfileRepository } from '@/features/profile/data/repositories/profile_repository';
import {
  StatsDetailSnapshot,
  StatsRange,
} from '@/features/profile/domain/entities/stats_detail';

const normalizeDate = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate());

const shiftAnchor = (anchor: Date, direction: number, range: StatsRange) => {
  if (range === 'day') {
    return new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + direction);
  }

  if (range === 'week') {
    return new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + direction * 7);
  }

  return new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1);
};

const startOfWeek = (value: Date) => {
  const normalized = normalizeDate(value);
  return new Date(normalized.getFullYear(), normalized.getMonth(), normalized.getDate() - normalized.getDay() + (normalized.getDay() === 0 ? -6 : 1));
};

const isFuture = (anchor: Date, range: StatsRange) => {
  const today = normalizeDate(new Date());

  if (range === 'day') {
    return anchor.getTime() > today.getTime();
  }

  if (range === 'week') {
    return startOfWeek(anchor).getTime() > startOfWeek(today).getTime();
  }

  return (
    anchor.getFullYear() > today.getFullYear() ||
    (anchor.getFullYear() === today.getFullYear() && anchor.getMonth() > today.getMonth())
  );
};

export const useStatsDetail = (userId?: string) => {
  const repository = useMemo(() => new ProfileRepository(), []);
  const [range, setRange] = useState<StatsRange>('week');
  const [anchorDate, setAnchorDate] = useState<Date>(() => normalizeDate(new Date()));
  const [deviceTimezone, setDeviceTimezone] = useState<string | null>(null);
  const [data, setData] = useState<StatsDetailSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setDeviceTimezone(timezone || 'UTC');
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    if (!deviceTimezone) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const snapshot = await repository.getStatsDetail(userId, range, anchorDate, deviceTimezone);
      setData(snapshot);
    } catch (nextError) {
      console.error('Failed to load stats detail.', nextError);
      setError('Failed to load detailed statistics.');
    } finally {
      setLoading(false);
    }
  }, [anchorDate, deviceTimezone, range, repository, userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    if (!deviceTimezone) {
      setLoading(true);
      return;
    }

    void refresh();
  }, [deviceTimezone, refresh, userId]);

  const updateRange = useCallback((nextRange: StatsRange) => {
    setRange(nextRange);
    setAnchorDate(normalizeDate(new Date()));
  }, []);

  const goPrev = useCallback(() => {
    setAnchorDate((current) => shiftAnchor(current, -1, range));
  }, [range]);

  const goNext = useCallback(() => {
    setAnchorDate((current) => {
      const next = shiftAnchor(current, 1, range);
      return isFuture(next, range) ? current : next;
    });
  }, [range]);

  const canGoNext = useMemo(() => {
    const next = shiftAnchor(anchorDate, 1, range);
    return !isFuture(next, range);
  }, [anchorDate, range]);

  return {
    data,
    range,
    loading,
    error,
    refresh,
    setRange: updateRange,
    goPrev,
    goNext,
    canGoNext,
  };
};
