import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioManager } from '../lib/audio/AudioManager';

export function useArenaAudio() {
  const audioRef = useRef<AudioManager | null>(null);
  const enabledRef = useRef(false);
  const busyRef = useRef(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioError, setAudioError] = useState('');

  const toggleAudio = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      if (!audioRef.current) {
        const audio = new AudioManager();
        audioRef.current = audio;
        await audio.init();
        enabledRef.current = true;
      } else {
        enabledRef.current = !enabledRef.current;
        audioRef.current.setMuted(!enabledRef.current);
      }
      setAudioEnabled(enabledRef.current);
      setAudioError('');
    } catch {
      audioRef.current?.stop();
      audioRef.current = null;
      enabledRef.current = false;
      setAudioEnabled(false);
      setAudioError('Audio is unavailable. You can still play without sound.');
    } finally {
      busyRef.current = false;
    }
  }, []);

  useEffect(() => () => { audioRef.current?.stop(); }, []);
  return { audioRef, audioEnabled, audioError, toggleAudio };
}
