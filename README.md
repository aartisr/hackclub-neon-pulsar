# Neon Pulsar: Zero-G Arena

A 3D multiplayer disc combat sport built for the browser. Featuring zero-gravity physics, WebRTC peer-to-peer networking, WebGL bloom post-processing, procedurally synthesized dynamic audio, customizable avatars, power-ups, and haptic feedback.

---

### Attribution & Engineering Credits
- **Organization & Engineering Team**: [PCSS II Robotics Team](https://pcssiirobotics.org)
- **Author & Lead Creator**: [Aarti S Ravikumar](https://ai-aarti.com)
- **Official Repository**: [https://github.com/aartisr/hackclub-neon-pulsar.git](https://github.com/aartisr/hackclub-neon-pulsar.git)

---

## Table of Contents

- [Overview](#overview)
- [How to Play](#how-to-play)
  - [1. Connecting & Matchmaking](#1-connecting--matchmaking)
  - [2. Avatar Customization](#2-avatar-customization)
  - [3. Controls & Flight Mechanics](#3-controls--flight-mechanics)
  - [4. Game Rules & Objectives](#4-game-rules--objectives)
  - [5. Power-Up System](#5-power-up-system)
  - [6. 3D Match Replay System](#6-3d-match-replay-system)
  - [7. Spectating System](#7-spectating-system)
  - [8. Highlight Camera & Net Particle Bursts](#8-highlight-camera--net-particle-bursts)
  - [9. Haptic Feedback (Vibration API)](#9-haptic-feedback-vibration-api)
  - [10. Career Statistics & Tier Ranking System](#10-career-statistics--tier-ranking-system)
- [Technical Architecture](#technical-architecture)
  - [Architecture Overview](#architecture-overview)
  - [P2P Network Topology & Protocol](#p2p-network-topology--protocol)
  - [Physics & Dynamic Light Probes](#physics--dynamic-light-probes)
  - [3D Rendering & Post-Processing](#3d-rendering--post-processing)
  - [Procedural Audio Synthesis](#procedural-audio-synthesis)
  - [State Synchronization & Framer Motion Transitions](#state-synchronization--framer-motion-transitions)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Development Server](#running-the-development-server)
  - [Building for Production](#building-for-production)
  - [Linting & Type Checking](#linting--type-checking)

---

## Overview

**Neon Pulsar** transports pilots into a futuristic, zero-gravity combat arena where two teams—**Team Cyan** and **Team Magenta**—clash for aerial supremacy. Players propel a hyper-elastic energy disc across 3D space, ricocheting off boundary walls and executing high-velocity throws to breach the opponent's goal portal.

---

## How to Play

### 1. Connecting & Matchmaking

1. **Set Pilot Handle**: Enter your pilot callsign on the landing menu.
2. **Host an Arena**:
   - Click **Host Arena** to instantiate a room as the authoritative host peer.
   - An arena code is automatically generated. In the Combat Lobby, use **Copy Code** to share the full room code, or **Copy Invite Link** to share a link.
3. **Join an Arena**:
   - Other players click **Join Arena**, paste the full room code or invite link, and click **Connect to Arena**.
   - PeerJS uses a signaling service to establish the connection; match data then travels over WebRTC DataChannels.
4. **Combat Lobby**:
   - In the lobby, pilots are automatically assigned to **Team Cyan** or **Team Magenta**.
   - The host initiates the combat simulation once pilots are ready.

---

### 2. Avatar Customization

Before launching or while in the lobby, click **Modify Avatar** to customize your combat drone:
- **Energy Core Colors**: Choose from 6 luminous neon wavelengths:
  - Cyan (`#06b6d4`)
  - Magenta (`#d946ef`)
  - Emerald (`#10b981`)
  - Amber (`#f59e0b`)
  - Crimson (`#ef4444`)
  - Radiant White (`#ffffff`)
- **Chassis Geometries**:
  - `Capsule`: Balanced aerodynamic chassis.
  - `Cube`: Aggressive industrial frame.
  - `Sphere`: Ultra-smooth kinetic hull.
  - `Octahedron`: Crystalline interceptor frame.
- **Network Sync**: Blueprint updates are dispatched over P2P network actions (`CUSTOMIZE`) and immediately reflected across all pilots' renderers.

---

### 3. Controls & Flight Mechanics

Pilots operate in six degrees of freedom within zero-G:

| Key Binding | Function | Description |
| :--- | :--- | :--- |
| `W` | **Forward** | Accelerate forward along the arena depth axis |
| `S` | **Backward** | Reverse thrusters along the arena depth axis |
| `A` | **Strafe Left** | Lateral strafe toward the left boundary |
| `D` | **Strafe Right** | Lateral strafe toward the right boundary |
| `SPACE` | **Ascend** | Vertical thrusters upward (`+Y` axis) |
| `LEFT SHIFT` | **Descend** | Vertical thrusters downward (`-Y` axis) |
| `E` | **Throw Disc** | Launch the disc forward with high impulse |
| `T` | **Global Chat** | Open open-frequency broadcast chat to all players |
| `Y` | **Team Chat** | Open team chat delivered only to teammates |
| `ENTER` | **Send Chat** | Transmit text and dismiss chat focus |
| `ESC` | **Dismiss HUD** | Close open menus/chat overlays |

---

### 4. Game Rules & Objectives

- **Arena Boundaries**: `40m (Width) x 20m (Height) x 60m (Depth)`.
- **Disc Possession**: Fly into the disc to secure possession. While attached, the disc tracks your position.
- **Disc Throw**: Press `E` while in possession to launch the disc along your forward trajectory.
- **Scoring**:
  - Launch the disc into the opponent's goal portal (centered at each end of the arena: `|X| < 5m` and `|Y| < 5m`).
  - Scoring in the positive Z net awards a point to **Team Cyan**.
  - Scoring in the negative Z net awards a point to **Team Magenta**.
- **Victory Condition**: First team to score **5 points** conquers the arena. A victory fanfare triggers with custom celebratory confetti, and the host can initiate an instant rematch.

---

### 5. Power-Up System

During active gameplay, dynamic orbital power-up nodes materialize throughout the arena:

| Power-Up | Color | Duration | Effect |
| :--- | :--- | :--- | :--- |
| **Speed Boost** (`speed`) | Cyan Glow | 8.0s | Increases pilot flight velocity by **1.8x** |
| **Chassis Expansion** (`size`) | Yellow Glow | 8.0s | Expands pilot collision radius by **1.6x**, drastically expanding disc interception zone |
| **Energy Shield** (`shield`) | Green Glow | 8.0s | Projects a defensive kinetic forcefield |

Power-ups animate with orbital spin in Three.js and despawn automatically upon collection.

---

### 6. 3D Match Replay System

After a match concludes, pilots can click **Watch 3D Match Replay** on the victory screen to enter a full 3D playback simulation:
- **Telemetry Recording**: Captures up to 30 FPS spatial telemetry (disc trajectory, velocity, player coordinates, scores) during live play, retaining at most 5,400 frames.
- **Replay Interpolation**: Uses linear vector interpolation between recorded frames at the browser's refresh rate.
- **Timeline Scrubbing & Controls**: Interactive timeline range slider with precise timestamp display, Play/Pause toggle, and 5-second Jump Rewind/Forward buttons.
- **Variable Playback Speeds**: Toggle between `0.5x` (slow-motion analysis), `1.0x` (real-time), `2.0x`, and `4.0x` fast-forward speeds.
- **Cinematic Replay Camera Modes**: Switch seamlessly between **Follow Disc** (tracks disc movement across zero-G space) and **Orbit View** (spins wide cinematic angles around the entire arena grid).

---

### 7. Spectating System

If a player connects to an arena while a match is currently active (`status === 'playing'`):
- The joining player is automatically flagged as `isSpectator: true`.
- They receive real-time game state updates and live 3D camera tracking without controlling an avatar.
- A glowing HUD badge indicates **SPECTATING - Joining Next Round...**.
- Upon round completion and rematch initiation, spectators automatically transition into active pilots.

---

### 8. Highlight Camera & Net Particle Bursts

Whenever a goal is scored:
- **Cinematic Zoom**: The 3D camera smoothly glides into a slow-motion highlight zoom focused squarely on the scoring goal portal.
- **Particle Burst**: An explosive burst of velocity-driven neon particles detonates across the goal frame in the scoring team's color.
- **Auto-Reset**: After a brief cinematic hold, the camera smoothly transitions back to tactical match perspective and gameplay resumes.

---

### 9. Haptic Feedback (Vibration API)

Supported mobile devices and vibration-capable browsers receive tactile physical feedback:
- **Wall Bounce**: Subtle 20ms haptic tap whenever the high-speed disc ricochets off arena walls.
- **Goal Scored**: Double impact rumble pattern (`[100ms, 50ms, 100ms]`) upon scoring a goal.

---

### 10. Career Statistics & Tier Ranking System

All pilot achievements persist locally via `localStorage` through `useCareerStats`:
- **Career Goals & Win Rate**: Tracks cumulative goals scored, total games played, total wins, and win percentage.
- **Rank Tier System**: Earn dynamic emblems displayed on the main menu based on career wins:
  - 🥉 **Bronze Pilot**: 0–4 Wins
  - 🥈 **Silver Pilot**: 5–14 Wins
  - 🥇 **Gold Pilot**: 15–29 Wins
  - 💎 **Neon Pulsar Tier**: 30+ Wins (unlocks glowing neon emblem)

---

## Technical Architecture

```
                                  +---------------------------------------+
                                  |            Host Browser               |
                                  |  - Physics Engine (60 FPS tick)       |
                                  |  - Authoritative GameState            |
                                  |  - Power-up Spawner                   |
                                  +-------------------+-------------------+
                                                      |
                                   WebRTC DataChannel | (State snapshots up to 20 Hz)
                                   (PeerJS host star) | (Receive Inputs / Actions)
                                                      |
                         +----------------------------+----------------------------+
                         |                                                         |
                         v                                                         v
         +-------------------------------+                         +-------------------------------+
         |        Client Peer 1          |                         |        Client Peer 2          |
         |  - Three.js WebGL Renderer    |                         |  - Three.js WebGL Renderer    |
         |  - Procedural Audio Engine    |                         |  - Procedural Audio Engine    |
         |  - Framer Motion HUD / UI     |                         |  - Framer Motion HUD / UI     |
         +-------------------------------+                         +-------------------------------+
```

### Architecture Overview

- **Runtime & UI**: React 19 SPA running on Vite 8, styled with Tailwind CSS v4.
- **3D Graphics Engine**: Three.js (`r187`) with custom geometry buffers and materials.
- **Post-Processing**: `three-stdlib` `EffectComposer` pipeline running `RenderPass` and `UnrealBloomPass` with HDR tone mapping (`ACESFilmicToneMapping`).
- **Networking**: `peerjs` WebRTC DataChannel layer for host-authoritative state synchronization. A signaling service is required to establish connections; latency depends on the peers and network.
- **Audio Synthesis**: Pure Web Audio API procedural synthesizer (zero audio assets/mp3 downloads).
- **Physics**: Custom zero-G 3D kinematic physics engine with drag coefficients, elastic boundary restitution, and sphere-sphere collision detection.

---

### P2P Network Topology & Protocol

The application employs a **host-authoritative star topology** built on WebRTC DataChannels:

1. **Host Peer**:
   - Manages the authoritative `GameState` clock at 60 Hz.
   - Validates client actions (`MOVE`, `THROW`, `CUSTOMIZE`, and chat); only the host can start a round.
   - Runs `PhysicsEngine.update()` to advance disc positions, resolve collisions, and register goals.
   - Broadcasts state snapshots at up to 20 Hz during play and immediately when lobby state changes.
2. **Client Peers**:
   - Transmit local input vectors (`localInputRef`) to the host.
   - Receive full state snapshots and interpolate positions within `GameRenderer.update()`.
   - Show an error and return to the join screen if the host disconnects.

#### Network Message Schema

```typescript
export type GameAction = 
  | { type: 'JOIN'; name: string; color?: string; shape?: ChassisType }
  | { type: 'LEAVE' } // host handles a peer disconnect
  | { type: 'READY'; ready: boolean }
  | { type: 'MOVE'; input: { x: number; y: number; z: number; jump: boolean; dash: boolean } }
  | { type: 'THROW'; direction: [number, number, number] }
  | { type: 'CHAT'; text: string; teamOnly: boolean }
  | { type: 'CUSTOMIZE'; color: string; shape: ChassisType }
  | { type: 'SWITCH_TEAM'; team: 1 | 2 }
  | { type: 'START_GAME' }; // host only
```

---

### Physics & Dynamic Light Probes

Located in `src/lib/game/Physics.ts`:

- **Kinematic Drag**: Velocity dampening formula applied per frame:
  $$\vec{v}_{t+1} = \vec{v}_t \times 0.98$$
- **Boundary Collisions**: Disc reverses axis velocity with restitution elasticity (`0.8`):
  $$v_x \leftarrow -v_x \times 0.8$$
- **Dynamic Arena Light Probes**: 8 dynamic light probes across the arena modulate their intensity in sync with match time and disc velocity:
  $$I_{\text{probe}} = I_{\text{base}} + \sin(\omega t) \cdot 1.5 \times (1 + \|\vec{v}_{\text{disc}}\|)$$
- **Dynamic Pickup Radii**: Interception testing scales based on player status and active `size` power-ups:
  $$\text{dist}^2 < (r_{\text{player}} \cdot \text{scale} + r_{\text{disc}})^2$$
- **Goal Volumes**: Detected when the disc traverses the boundary plane $|Z| > 30 - r_{\text{disc}}$ within portal aperture $|X| < 5$ and $|Y| < 5$.

---

### 3D Rendering & Post-Processing

Located in `src/lib/game/Renderer.ts`:

- **Volumetric Bloom**: An `UnrealBloomPass` is configured with strength `1.5`, radius `0.4`, and threshold `0.85` for glowing neon aesthetics.
- **Dynamic Lighting Controller**:
  - `ambientLight` intensity dynamically modulates based on match intensity (disc velocity ratio and match duration).
  - Directional light casts real-time depth shadows across the arena grid floor.
- **Custom Shaders & Materials**:
  - Disc: Wireframe lattice interior nested inside a translucent glow sphere.
  - Avatars: Dynamically generated meshes corresponding to pilot chassis blueprints (`capsule`, `cube`, `sphere`, `octa`) with customizable emissive color shaders.
  - Minimap Radar: 2D projection transformed from 3D world space coordinates:
    $$x_{\%} = \frac{x + 20}{40} \times 100, \quad z_{\%} = \frac{z + 30}{60} \times 100$$

---

### Procedural Audio Synthesis

Located in `src/lib/audio/AudioManager.ts`:

- **Harmonic Drone**: Four sawtooth oscillators tuned to an open harmonic chord ($55\text{Hz}, 110\text{Hz}, 164.81\text{Hz}, 220\text{Hz}$).
- **Dynamic Cutoff Filter**: The low-pass filter frequency modulates continuously with disc velocity ($200\text{Hz} \to 2400\text{Hz}$), intensifying sonic tension during high-speed volleys.
- **Rhythmic Pulse**: A synchronized 16-step sub-bass synth pulse driven by the Web Audio clock.

---

### State Synchronization & Framer Motion Transitions

- Direct children of Framer Motion's `<AnimatePresence mode="wait">` utilize strict, persistent keys (`overlay-landing`, `overlay-lobby`, `overlay-ended`, `overlay-customizer`) to prevent React element reconciliation conflicts.
- Real-time radar markers, chat toasts, and HUD gauges utilize spring physics for smooth interpolation.

---

## Project Structure

- `src/App.tsx` composes the screens and coordinates match actions.
- `src/components/landing/`, `overlays/`, `hud/`, and `ui/` contain focused UI components and shared selectors.
- `src/hooks/useArenaRuntime.ts` owns the fixed-step game loop, rendering, and network update cadence; `useFlightControls.ts`, `useArenaAudio.ts`, and `useMatchReplay.ts` isolate input, sound, and replay behavior.
- `src/lib/game/actions.ts` applies immutable game rules; `state.ts` creates and clones state; `Physics.ts` advances simulation; `SceneObjects.ts` creates and disposes Three.js objects; `Renderer.ts` updates the scene.
- `src/lib/network/PeerManager.ts` owns PeerJS connections, while `protocol.ts` validates peer messages.
- `src/lib/replay/synthesize.ts` interpolates recorded frames for playback.
- `src/types/game.ts` defines the shared game model. `src/services/leaderboardService.ts` currently returns sample standings with the current browser's stats.

Run `npm run lint`, `npm test`, and `npm run build` to check types, game rules, protocol validation, and the production bundle.

---

## Getting Started

### Prerequisites

- **Node.js**: `v20.19.0` or later in the 20.x line, or `v22.12.0` or higher (required by Vite 8)
- **npm** or **bun**
- A modern WebGL-compatible browser (Chrome, Edge, Firefox, Safari)

### Installation

Clone the repository and install dependencies:

```bash
npm install
```

For local installs through a corporate npm registry, keep the registry and its credentials in your user npm configuration. If Artifactory returns duplicated paths in package tarball URLs, add `replace-registry-host=never` to a local `.npmrc`; this file is ignored by Git. Local npm lockfiles are also ignored so registry URLs are not committed for Vercel.

### Running the Development Server

Start the local development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser. To test multiplayer locally, open a second browser window (or incognito window), host an arena in the first window, and join using the room code in the second window.

### Building for Production

Compile optimized production assets:

```bash
npm run build
```

The output will be placed in the `/dist` directory.

### Linting & Type Checking

Validate TypeScript types without emitting:

```bash
npm run lint
```

---

## License

This project is licensed under the Apache-2.0 License.
