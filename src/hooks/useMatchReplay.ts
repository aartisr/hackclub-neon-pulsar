import { useState, useRef, useCallback, useEffect } from 'react';
import { GameState, ReplayFrame, ReplayPlayerFrame } from '../types/game';
import { synthesizeReplayState } from '../lib/replay/synthesize';

export type CameraMode = 'orbit' | 'disc' | 'player';

export function useMatchReplay() {
  const recordingBufferRef = useRef<ReplayFrame[]>([]);
  const lastRecordedTimeRef = useRef<number>(-Infinity);

  const [replayFrames, setReplayFrames] = useState<ReplayFrame[]>([]);
  const [isReplaying, setIsReplaying] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [currentReplayTime, setCurrentReplayTime] = useState<number>(0);
  const [cameraMode, setCameraMode] = useState<CameraMode>('disc');

  // Record a snapshot of the current match frame
  const recordFrame = useCallback((state: GameState) => {
    if (state.status !== 'playing') return;

    // Match time is authoritative; browser refresh rates can vary widely.
    if (state.time - lastRecordedTimeRef.current < 1 / 30) return;
    lastRecordedTimeRef.current = state.time;

    const playersSnapshot: Record<string, ReplayPlayerFrame> = {};
    for (const id in state.players) {
      const p = state.players[id];
      if (p && !p.isSpectator) {
        playersSnapshot[id] = {
          id: p.id,
          name: p.name,
          team: p.team,
          position: [...p.position] as [number, number, number],
          avatarShape: p.avatarShape,
          customColor: p.customColor,
        };
      }
    }

    const frame: ReplayFrame = {
      time: state.time,
      discPosition: [...state.disc.position] as [number, number, number],
      discVelocity: [...state.disc.velocity] as [number, number, number],
      players: playersSnapshot,
      score: { ...state.score },
    };

    recordingBufferRef.current.push(frame);
    if (recordingBufferRef.current.length > 5400) recordingBufferRef.current.shift();
  }, []);

  const clearRecording = useCallback(() => {
    recordingBufferRef.current = [];
    lastRecordedTimeRef.current = -Infinity;
    setReplayFrames([]);
    setIsReplaying(false);
    setCurrentReplayTime(0);
  }, []);

  const prepareReplay = useCallback(() => {
    const frames = [...recordingBufferRef.current];
    setReplayFrames(frames);
    return frames.length > 0;
  }, []);

  const startReplay = useCallback(() => {
    if (recordingBufferRef.current.length === 0) return false;
    const frames = [...recordingBufferRef.current];
    setReplayFrames(frames);
    setIsReplaying(true);
    setIsPlaying(true);
    setCurrentReplayTime(frames[0]?.time || 0);
    return true;
  }, []);

  const stopReplay = useCallback(() => {
    setIsReplaying(false);
    setIsPlaying(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!isPlaying && replayFrames.length > 0 && currentReplayTime >= replayFrames[replayFrames.length - 1].time) {
      setCurrentReplayTime(replayFrames[0].time);
    }
    setIsPlaying(!isPlaying);
  }, [currentReplayTime, isPlaying, replayFrames]);

  const seekToTime = useCallback((time: number) => {
    if (replayFrames.length === 0) return;
    const startTime = replayFrames[0].time;
    const endTime = replayFrames[replayFrames.length - 1].time;
    const clamped = Math.max(startTime, Math.min(endTime, time));
    setCurrentReplayTime(clamped);
  }, [replayFrames]);

  const advanceReplayTime = useCallback((deltaSeconds: number) => {
    if (!isReplaying || !isPlaying || replayFrames.length === 0) return;

    const endTime = replayFrames[replayFrames.length - 1].time;

    setCurrentReplayTime(prev => Math.min(endTime, prev + deltaSeconds * playbackSpeed));
  }, [isReplaying, isPlaying, playbackSpeed, replayFrames]);

  useEffect(() => {
    if (isReplaying && isPlaying && replayFrames.length > 0 && currentReplayTime >= replayFrames[replayFrames.length - 1].time) {
      setIsPlaying(false);
    }
  }, [currentReplayTime, isPlaying, isReplaying, replayFrames]);

  const getSynthesizedGameState = useCallback(
    (timestamp: number) => synthesizeReplayState(replayFrames, timestamp),
    [replayFrames]
  );

  const maxReplayTime = replayFrames.length > 0 ? replayFrames[replayFrames.length - 1].time : 0;
  const minReplayTime = replayFrames.length > 0 ? replayFrames[0].time : 0;

  return {
    isReplaying,
    isPlaying,
    playbackSpeed,
    currentReplayTime,
    minReplayTime,
    maxReplayTime,
    cameraMode,
    frameCount: recordingBufferRef.current.length,
    hasReplayData: recordingBufferRef.current.length > 0,
    recordFrame,
    clearRecording,
    prepareReplay,
    startReplay,
    stopReplay,
    togglePlayPause,
    setSpeed: setPlaybackSpeed,
    setCameraMode,
    seekToTime,
    advanceReplayTime,
    getSynthesizedGameState,
  };
}
