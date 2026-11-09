# Neon Pulsar: Zero-G Arena

A high-octane, zero-latency 3D multiplayer disc combat sport built for the browser. Featuring zero-gravity physics, WebRTC peer-to-peer networking, WebGL bloom post-processing, procedurally synthesized dynamic audio, customizable avatars, power-ups, and haptic feedback.

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
   - An arena code is automatically generated. Click the lobby share button or copy the room code to distribute to other pilots.
3. **Join an Arena**:
   - Other players click **Join Arena**, enter the host's room code, and click **Initialize Connection**.
   - Peers connect directly via WebRTC DataChannels with zero intermediate servers.
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
| `Y` | **Team Chat** | Open encrypted frequency chat visible only to teammates |
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
- **Telemetry Recording**: Captures 30 FPS spatial telemetry (disc trajectory, velocity, player coordinates, scores) during live play (~250 KB memory footprint per match).
- **Butter-Smooth 60 FPS Interpolation**: Uses linear vector lerping between keyframes to render liquid-smooth 60 FPS spatial playback.
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
                                   WebRTC DataChannel | (Broadcast State @ 60 FPS)
                                   (PeerJS Mesh/Star) | (Receive Inputs / Actions)
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
- **Networking**: `peerjs` WebRTC DataChannel layer providing sub-millisecond host-authoritative peer synchronization without server infrastructure.
- **Audio Synthesis**: Pure Web Audio API procedural synthesizer (zero audio assets/mp3 downloads).
- **Physics**: Custom zero-G 3D kinematic physics engine with drag coefficients, elastic boundary restitution, and sphere-sphere collision detection.

---

### P2P Network Topology & Protocol

The application employs a **host-authoritative star topology** built on WebRTC DataChannels:

1. **Host Peer**:
   - Manages the authoritative `GameState` clock at 60 Hz.
   - Evaluates input buffers received from all peers (`MOVE`, `THROW`, `CUSTOMIZE`, `START_GAME`).
   - Runs `PhysicsEngine.update()` to advance disc positions, resolve collisions, and register goals.
   - Broadcasts the synchronized state payload to all connected peers via `peerRef.current.broadcastState()`.
2. **Client Peers**:
   - Transmit local input vectors (`localInputRef`) to the host.
   - Receive full state snapshots and interpolate positions within `GameRenderer.update()`.
   - Maintain seamless disconnect recovery through connection listeners.

#### Network Message Schema

```typescript
export type GameAction = 
  | { type: 'JOIN'; name: string; color?: string; shape?: AvatarShape }
  | { type: 'READY'; ready: boolean }
  | { type: 'MOVE'; input: { x: number; y: number; z: number; jump: boolean; dash: boolean } }
  | { type: 'THROW'; direction: [number, number, number] }
  | { type: 'CHAT'; text: string; teamOnly: boolean }
  | { type: 'CUSTOMIZE'; color: string; shape: AvatarShape }
  | { type: 'START_GAME' };
```

---

### Physics & Dynamic Light Probes

Located in `src/lib/game/Physics.ts`:

- **Kinematic Drag**: Velocity dampening formula applied per frame:
  $$\vec{v}_{t+1} = \vec{v}_t \times 0.98$$
- **Boundary Collisions**: Disc reverses axis velocity with restitution elasticity (`0.8`):
  $$v_x \leftarrow -v_x \times 0.8$$
- **Dynamic Arena Light Probes**: 4 dynamic light probes strategically placed across the arena ceiling and goal portals modulate their pulse frequency, intensity, and hue in sync with audio intensity and disc velocity:
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

```
├── .env.example                  # Environment variable definitions
├── index.html                    # HTML entry point with Orbitron & Plus Jakarta Sans
├── metadata.json                 # AI Studio applet metadata & capabilities
├── package.json                  # Project dependencies & build scripts
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite configuration with React & Tailwind plugins
└── src/
    ├── main.tsx                  # React DOM bootstrap
    ├── index.css                 # Tailwind v4 theme & font definitions
    ├── App.tsx                   # Modular composition root & game coordinator
    ├── types/
    │   └── game.ts               # Centralized game types, actions, & chassis presets
    ├── hooks/
    │   ├── useCareerStats.ts     # LocalStorage persistent career stats hook
    │   └── useResponsive.ts      # Multi-device breakpoint & touch detection hook
    ├── components/
    │   ├── ui/
    │   │   └── SoundToggle.tsx   # Reusable procedural audio toggle button
    │   ├── game/
    │   │   └── CanvasContainer.tsx # WebGL canvas container with graceful fallback
    │   ├── overlays/
    │   │   ├── LandingOverlay.tsx  # Matchmaking, callsign, & quick chassis selector
    │   │   ├── LobbyOverlay.tsx    # Team Cyan & Magenta rosters & launch combat
    │   │   ├── VictoryOverlay.tsx  # Match summary, winner fanfare, & rematch
    │   │   └── CustomizerModal.tsx # Full chassis & energy wavelength editor
    │   └── hud/
    │       ├── GameHud.tsx       # Root container orchestrating all match HUD modules
    │       ├── Scoreboard.tsx    # Floating team scores, clock, & exit match
    │       ├── GoalBanner.tsx    # Animated celebratory goal announcement
    │       ├── RadarMap.tsx      # Top-down 2D radar projection of players & disc
    │       ├── Speedometer.tsx   # Dynamic vertical velocity gauge
    │       ├── ControlsGuide.tsx # Collapsible keyboard controls helper ([H])
    │       ├── TouchControls.tsx # Mobile/tablet virtual D-Pad, altitude & throw
    │       ├── ChatOverlay.tsx   # In-game chat toasts & team/global input
    │       └── SpectatorBadge.tsx # Real-time spectator status indicator
    └── lib/
        ├── audio/
        │   └── AudioManager.ts   # Web Audio API procedural synthesizer
        ├── game/
        │   ├── Constants.ts      # Arena bounds, speeds, & physics constants
        │   ├── Physics.ts        # Zero-G kinematic simulation & collisions
        │   └── Renderer.ts       # Three.js scene, dynamic lighting, & post-processing
        └── network/
            └── PeerManager.ts    # WebRTC PeerJS DataChannel manager
```

---

## Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm** or **bun**
- A modern WebGL-compatible browser (Chrome, Edge, Firefox, Safari)

### Installation

Clone the repository and install dependencies:

```bash
npm install
```

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
