/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';

export const useAudio = (url: string, initialVolume: number = 0.5) => {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(initialVolume);

  useEffect(() => {
    audio.current = new Audio(url);
    audio.current.loop = true;
    audio.current.volume = volume;

    return () => {
      audio.current?.pause();
      audio.current = null;
    };
  }, [url]);

  useEffect(() => {
    if (audio.current) {
      audio.current.volume = volume;
    }
  }, [volume]);

  const toggle = async () => {
    if (!audio.current) return;
    
    if (isPlaying) {
      audio.current.pause();
    } else {
      try {
        await audio.current.play();
      } catch (err) {
        console.error("Audio playback error:", err);
      }
    }
    setIsPlaying(!isPlaying);
  };

  const startAudio = async () => {
    if (!audio.current || isPlaying) return;
    try {
      await audio.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.error("Audio auto-play blocked:", err);
    }
  };

  const setAudioVolume = (v: number) => {
    setVolume(v);
  };

  return { isPlaying, toggle, startAudio, setAudioVolume, volume };
};
