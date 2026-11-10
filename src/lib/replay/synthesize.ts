import type { GameState, PlayerState, ReplayFrame } from '../../types/game';
import { DEFAULT_LIGHT_PROBES } from '../../types/game';

export function synthesizeReplayState(frames: ReplayFrame[], timestamp: number): GameState | null {
    if (frames.length === 0) return null;

    const startTime = frames[0].time;
    const endTime = frames[frames.length - 1].time;
    const clampedTime = Math.max(startTime, Math.min(endTime, timestamp));

    // Binary search keeps replay seeking fast for long matches.
    let low = 0;
    let high = frames.length - 1;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (frames[middle].time < clampedTime) low = middle + 1;
      else high = middle;
    }
    const nextFrame = frames[low];
    const prevFrame = frames[Math.max(0, low - 1)];

    const duration = nextFrame.time - prevFrame.time;
    const alpha = duration > 0 ? (clampedTime - prevFrame.time) / duration : 0;

    // Lerp disc position
    const discPos: [number, number, number] = [
      prevFrame.discPosition[0] + (nextFrame.discPosition[0] - prevFrame.discPosition[0]) * alpha,
      prevFrame.discPosition[1] + (nextFrame.discPosition[1] - prevFrame.discPosition[1]) * alpha,
      prevFrame.discPosition[2] + (nextFrame.discPosition[2] - prevFrame.discPosition[2]) * alpha,
    ];

    // Lerp player positions
    const interpolatedPlayers: Record<string, PlayerState> = {};
    const allPlayerIds = new Set([
      ...Object.keys(prevFrame.players),
      ...Object.keys(nextFrame.players),
    ]);

    allPlayerIds.forEach(id => {
      const pPrev = prevFrame.players[id];
      const pNext = nextFrame.players[id];

      if (pPrev && pNext) {
        interpolatedPlayers[id] = {
          id: pPrev.id,
          name: pPrev.name,
          team: pPrev.team,
          position: [
            pPrev.position[0] + (pNext.position[0] - pPrev.position[0]) * alpha,
            pPrev.position[1] + (pNext.position[1] - pPrev.position[1]) * alpha,
            pPrev.position[2] + (pNext.position[2] - pPrev.position[2]) * alpha,
          ],
          rotation: [0, 0, 0],
          ready: true,
          isSpectator: false,
          effects: [],
          avatarShape: pPrev.avatarShape || 'capsule',
          customColor: pPrev.customColor || '#06b6d4',
        };
      } else if (pNext) {
        interpolatedPlayers[id] = {
          id: pNext.id,
          name: pNext.name,
          team: pNext.team,
          position: [...pNext.position],
          rotation: [0, 0, 0],
          ready: true,
          isSpectator: false,
          effects: [],
          avatarShape: pNext.avatarShape || 'capsule',
          customColor: pNext.customColor || '#06b6d4',
        };
      }
    });

    return {
      players: interpolatedPlayers,
      disc: {
        position: discPos,
        velocity: prevFrame.discVelocity,
        ownerId: null,
      },
      score: prevFrame.score,
      time: clampedTime,
      status: 'playing',
      messages: [],
      powerUps: [],
      lightProbes: DEFAULT_LIGHT_PROBES,
    };
}
