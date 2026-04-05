'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MusicTrack, focusMusicTracks } from '@/features/focus/presentation/utils/musicLibrary';

export const useFocusMusicPlayer = () => {
  const tracks = useMemo(() => focusMusicTracks, []);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.7);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      setCurrentTrack(null);
      setIsPlaying(false);
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTrack(null);
  }, []);

  const playTrack = useCallback(
    async (track: MusicTrack) => {
      const currentAudio = audioRef.current;

      if (currentAudio && currentTrack?.id !== track.id) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      const audio =
        currentTrack?.id === track.id && currentAudio ? currentAudio : new Audio(track.assetPath);

      audio.volume = volume;
      audio.loop = false;
      audioRef.current = audio;
      setCurrentTrack(track);

      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Failed to play focus track.', error);
        setIsPlaying(false);
      }
    },
    [currentTrack?.id, volume]
  );

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        return;
      } catch (error) {
        console.error('Failed to resume focus track.', error);
      }
    }

    if (tracks.length > 0) {
      await playTrack(tracks[0]);
    }
  }, [playTrack, tracks]);

  const toggleMainPlayPause = useCallback(async () => {
    if (!currentTrack && tracks.length > 0) {
      await playTrack(tracks[0]);
      return;
    }

    if (isPlaying) {
      pause();
      return;
    }

    await resume();
  }, [currentTrack, isPlaying, pause, playTrack, resume, tracks]);

  const next = useCallback(async () => {
    if (!tracks.length) {
      return;
    }

    if (!currentTrack) {
      await playTrack(tracks[0]);
      return;
    }

    const currentIndex = tracks.findIndex((track) => track.id === currentTrack.id);
    const nextTrack = tracks[(currentIndex + 1) % tracks.length];
    await playTrack(nextTrack);
  }, [currentTrack, playTrack, tracks]);

  const setVolume = useCallback((nextVolume: number) => {
    const normalized = Math.max(0, Math.min(1, nextVolume));
    setVolumeState(normalized);

    if (audioRef.current) {
      audioRef.current.volume = normalized;
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const handleEnded = () => {
      void next();
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, [currentTrack, next]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (!audio) {
        return;
      }

      audio.pause();
      audio.src = '';
    };
  }, []);

  return {
    tracks,
    currentTrack,
    isPlaying,
    volume,
    playTrack,
    pause,
    resume,
    stop,
    next,
    toggleMainPlayPause,
    setVolume,
  };
};
