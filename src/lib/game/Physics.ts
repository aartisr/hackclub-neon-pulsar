import { ARENA_SIZE, PHYSICS, PLAYER_RADIUS, DISC_RADIUS } from './Constants';
import { GameState, MoveInput, DEFAULT_LIGHT_PROBES } from '../../types/game';
import { cloneGameState } from './state';

export class PhysicsEngine {
  public static update(state: GameState, inputs: Record<string, MoveInput>): GameState {
    const nextState = cloneGameState(state);
    nextState.time += 1 / 60;
    
    // Update players
    for (const id in nextState.players) {
      const player = nextState.players[id];
      if (player.isSpectator) continue;
      const input = inputs[id] || { x: 0, y: 0, z: 0, jump: false, dash: false };

      // Apply Power-up Effects to physics
      let speedMult = 1.0;
      let radiusMult = 1.0;
      
      player.effects = player.effects.filter(e => e.endTime > nextState.time);
      player.effects.forEach(e => {
        if (e.type === 'speed') speedMult = 1.8;
        if (e.type === 'size') radiusMult = 1.6;
      });

      const currentRadius = PLAYER_RADIUS * radiusMult;

      // Movement
      player.position[0] += input.x * PHYSICS.playerSpeed * speedMult;
      player.position[1] += input.y * PHYSICS.playerSpeed * speedMult;
      player.position[2] += input.z * PHYSICS.playerSpeed * speedMult;

      // Arena bounds for players
      player.position[0] = Math.max(-ARENA_SIZE.width / 2 + currentRadius, Math.min(ARENA_SIZE.width / 2 - currentRadius, player.position[0]));
      player.position[1] = Math.max(-ARENA_SIZE.height / 2 + currentRadius, Math.min(ARENA_SIZE.height / 2 - currentRadius, player.position[1]));
      player.position[2] = Math.max(-ARENA_SIZE.depth / 2 + currentRadius, Math.min(ARENA_SIZE.depth / 2 - currentRadius, player.position[2]));

      // Power-up Collection
      nextState.powerUps.forEach(pu => {
        if (!pu.active) return;
        const distSq = 
          Math.pow(player.position[0] - pu.position[0], 2) +
          Math.pow(player.position[1] - pu.position[1], 2) +
          Math.pow(player.position[2] - pu.position[2], 2);
        
        if (distSq < Math.pow(currentRadius + 1.0, 2)) {
          pu.active = false;
          player.effects.push({
            type: pu.type,
            endTime: nextState.time + 8.0 // 8 second duration
          });
        }
      });
    }

    // Spawn Power-ups
    if (nextState.status === 'playing' && nextState.powerUps.filter(p => p.active).length < 2) {
      // Approx 1% chance per frame (at 60fps) to spawn if below limit
      if (Math.random() < 0.005) {
        const types: ('speed' | 'size' | 'shield')[] = ['speed', 'size', 'shield'];
        nextState.powerUps.push({
          id: Math.random().toString(36).substr(2, 9),
          type: types[Math.floor(Math.random() * types.length)],
          position: [
            (Math.random() - 0.5) * (ARENA_SIZE.width - 10),
            (Math.random() - 0.5) * (ARENA_SIZE.height - 10),
            (Math.random() - 0.5) * (ARENA_SIZE.depth - 20)
          ],
          active: true
        });
      }
    }
    // Cleanup inactive power-ups
    if (nextState.powerUps.length > 10) {
      nextState.powerUps = nextState.powerUps.filter(p => p.active);
    }

    // Update disc
    const disc = nextState.disc;
    if (disc.ownerId) {
      const owner = nextState.players[disc.ownerId];
      if (owner) {
        disc.position = [...owner.position] as [number, number, number];
        disc.velocity = [0, 0, 0];
      }
    } else {
      // Free disc movement
      disc.position[0] += disc.velocity[0];
      disc.position[1] += disc.velocity[1];
      disc.position[2] += disc.velocity[2];

      // Drag
      disc.velocity[0] *= PHYSICS.drag;
      disc.velocity[1] *= PHYSICS.drag;
      disc.velocity[2] *= PHYSICS.drag;

      // Arena bounds and bouncing for disc
      if (Math.abs(disc.position[0]) > ARENA_SIZE.width / 2 - DISC_RADIUS) {
        disc.velocity[0] *= -PHYSICS.bounceElasticity;
        disc.position[0] = Math.sign(disc.position[0]) * (ARENA_SIZE.width / 2 - DISC_RADIUS);
      }
      if (Math.abs(disc.position[1]) > ARENA_SIZE.height / 2 - DISC_RADIUS) {
        disc.velocity[1] *= -PHYSICS.bounceElasticity;
        disc.position[1] = Math.sign(disc.position[1]) * (ARENA_SIZE.height / 2 - DISC_RADIUS);
      }
      
      // Goal check or bouncing on ends
      if (Math.abs(disc.position[2]) > ARENA_SIZE.depth / 2 - DISC_RADIUS) {
        // Simple goal logic: central area of ends
        const isGoal = Math.abs(disc.position[0]) < 5 && Math.abs(disc.position[1]) < 5;
        if (isGoal) {
          // Cyan starts at +Z and attacks the -Z goal; Magenta attacks +Z.
          if (disc.position[2] < 0) nextState.score.team1++;
          else nextState.score.team2++;
          
          this.resetDisc(nextState);
        } else {
          disc.velocity[2] *= -PHYSICS.bounceElasticity;
          disc.position[2] = Math.sign(disc.position[2]) * (ARENA_SIZE.depth / 2 - DISC_RADIUS);
        }
      }

      // Player-Disc pickup collision
      for (const id in nextState.players) {
        const player = nextState.players[id];
        if (player.isSpectator) continue;
        // Calculate dynamic radius for collision
        let radiusMult = 1.0;
        player.effects.forEach(e => { if (e.type === 'size') radiusMult = 1.6; });
        const currentRadius = PLAYER_RADIUS * radiusMult;

        const distSq = 
          Math.pow(player.position[0] - disc.position[0], 2) +
          Math.pow(player.position[1] - disc.position[1], 2) +
          Math.pow(player.position[2] - disc.position[2], 2);
        
        if (distSq < Math.pow(currentRadius + DISC_RADIUS, 2)) {
          disc.ownerId = id;
          break;
        }
      }
    }

    // Update Dynamic Light Probes (pulsing in sync with audio tempo & match kinetics)
    if (!nextState.lightProbes?.length) {
      nextState.lightProbes = DEFAULT_LIGHT_PROBES.map(probe => ({ ...probe, position: [...probe.position] }));
    }

    const discVelocity = nextState.disc.velocity;
    const discSpeed = Math.sqrt(discVelocity[0] ** 2 + discVelocity[1] ** 2 + discVelocity[2] ** 2);
    
    // Audio tempo matching 128 BPM synthesizer rhythm (beat ~2.133 Hz)
    const bpm = 128;
    const beatFrequency = (bpm / 60) * 2 * Math.PI; // ~13.4 rad/s
    const audioIntensityFactor = nextState.status === 'playing' 
      ? 0.5 + Math.min(discSpeed / 1.5, 1.2) * 0.7 
      : 0.35;

    nextState.lightProbes = nextState.lightProbes.map(probe => {
      // Harmonic wave oscillation locked to 128 BPM beat
      const primaryWave = (Math.sin(nextState.time * beatFrequency + probe.pulsePhase) + 1) / 2;
      // Secondary 16th-note sub-pulse
      const subWave = (Math.sin(nextState.time * beatFrequency * 4 + probe.pulsePhase * 2) + 1) / 2 * 0.25;

      // Proximity surge when disc traverses near this light probe
      const distSq = 
        Math.pow(nextState.disc.position[0] - probe.position[0], 2) +
        Math.pow(nextState.disc.position[1] - probe.position[1], 2) +
        Math.pow(nextState.disc.position[2] - probe.position[2], 2);
      
      const proximityRange = probe.range || 18;
      const proximitySurge = distSq < Math.pow(proximityRange, 2)
        ? (1.0 - Math.sqrt(distSq) / proximityRange) * 1.6
        : 0;

      // Base rhythmic glow + audio intensity scaling + disc kinetic surge
      const targetIntensity = (primaryWave * 0.65 + subWave + 0.35) * audioIntensityFactor + proximitySurge;

      return {
        ...probe,
        intensity: Math.max(0.2, Math.min(3.5, targetIntensity)),
      };
    });

    return nextState;
  }

  public static resetDisc(state: GameState, resetScore: boolean = false) {
    state.disc = {
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      ownerId: null,
    };
    if (resetScore) {
      state.score = { team1: 0, team2: 0 };
    }
  }
}
