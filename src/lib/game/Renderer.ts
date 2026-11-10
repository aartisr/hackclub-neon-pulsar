import * as THREE from 'three';
import { EffectComposer, RenderPass, UnrealBloomPass, RoomEnvironment } from 'three-stdlib';
import { GameState } from '../../types/game';
import { createArena, createDisc, createPlayerMesh, createPowerUpMesh, createLightProbeMesh, disposeObject3D } from './SceneObjects';
import { TEAM_COLORS } from './Constants';

export class GameRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private playerMeshes: Map<string, THREE.Group> = new Map();
  private powerUpMeshes: Map<string, THREE.Mesh> = new Map();
  private probeMeshes: Map<string, {
    group: THREE.Group;
    core: THREE.Mesh;
    ring1: THREE.Mesh;
    ring2: THREE.Mesh;
    light: THREE.PointLight;
  }> = new Map();
  private probeGroup: THREE.Group;
  private discMesh: THREE.Mesh;
  private arena: THREE.Group;
  private ambientLight: THREE.AmbientLight | null = null;
  private mainLight: THREE.DirectionalLight | null = null;
  private isSoftwareGl: boolean = false;
  
  // Highlight system
  private highlightTimer = 0;
  private highlightTarget: THREE.Vector3 | null = null;
  private particles: THREE.Points | null = null;
  private scratchVector = new THREE.Vector3();
  private particleVelocity: Float32Array | null = null;

  constructor(container: HTMLDivElement) {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x050505, 10, 100);
    
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 15, 40);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x050505);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(this.renderer.domElement);

    // Environment
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const roomEnvironment = new (RoomEnvironment as unknown as new () => THREE.Scene)();
    this.scene.environment = pmremGenerator.fromScene(roomEnvironment, 0.04).texture;
    disposeObject3D(roomEnvironment);
    pmremGenerator.dispose();

    // Post Processing (Bloom)
    const renderScene = new RenderPass(this.scene, this.camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5, 0.4, 0.85
    );
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(bloomPass);

    // Lights
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);

    this.mainLight = new THREE.DirectionalLight(0xffffff, 1);
    this.mainLight.position.set(10, 20, 10);
    this.mainLight.castShadow = true;
    this.scene.add(this.mainLight);

    // Arena
    this.arena = createArena();
    this.scene.add(this.arena);

    // Dynamic Light Probes Group
    this.probeGroup = new THREE.Group();
    this.scene.add(this.probeGroup);

    // Disc
    this.discMesh = createDisc();
    this.scene.add(this.discMesh);

    // Particle System
    this.initParticles();

    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
  }

  private initParticles() {
    const count = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    this.particleVelocity = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.2,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    
    this.particles = new THREE.Points(geometry, material);
    this.particles.visible = false;
    this.scene.add(this.particles);
  }

  public triggerHighlight(target: [number, number, number], color: number) {
    this.highlightTimer = 1.5; // 1.5 seconds of highlight
    this.highlightTarget = new THREE.Vector3(...target);
    
    if (this.particles) {
      this.particles.visible = true;
      (this.particles.material as THREE.PointsMaterial).color.setHex(color);
      
      const posAttr = this.particles.geometry.attributes.position as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;
      
      for (let i = 0; i < 500; i++) {
        positions[i * 3] = target[0];
        positions[i * 3 + 1] = target[1];
        positions[i * 3 + 2] = target[2];
        
        this.particleVelocity![i * 3] = (Math.random() - 0.5) * 0.5;
        this.particleVelocity![i * 3 + 1] = (Math.random() - 0.5) * 0.5;
        this.particleVelocity![i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      }
      posAttr.needsUpdate = true;
    }
  }

  public update(state: GameState, myId: string, customCameraMode?: 'orbit' | 'disc' | 'player', deltaSeconds = 1 / 60) {
    // Update Particles
    if (this.particles && this.particles.visible) {
      const posAttr = this.particles.geometry.attributes.position as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;
      for (let i = 0; i < 500; i++) {
        positions[i * 3] += this.particleVelocity![i * 3];
        positions[i * 3 + 1] += this.particleVelocity![i * 3 + 1];
        positions[i * 3 + 2] += this.particleVelocity![i * 3 + 2];
        this.particleVelocity![i * 3 + 1] -= 0.005; // Gravity
      }
      posAttr.needsUpdate = true;
      (this.particles.material as THREE.PointsMaterial).opacity *= 0.98;
      if ((this.particles.material as THREE.PointsMaterial).opacity < 0.01) {
        this.particles.visible = false;
        (this.particles.material as THREE.PointsMaterial).opacity = 0.8;
      }
    }

    // Update Disc
    this.discMesh.position.set(...state.disc.position);
    
    // Update Players
    for (const id in state.players) {
      const playerState = state.players[id];
      
      // Skip rendering spectators
      if (playerState.isSpectator) {
        if (this.playerMeshes.has(id)) {
          const oldMesh = this.playerMeshes.get(id)!;
          this.scene.remove(oldMesh);
          disposeObject3D(oldMesh);
          this.playerMeshes.delete(id);
        }
        continue;
      }

      let mesh = this.playerMeshes.get(id);
      
      if (!mesh || mesh.userData.shape !== playerState.avatarShape) {
        if (mesh) {
          this.scene.remove(mesh);
          disposeObject3D(mesh);
        }
        mesh = createPlayerMesh(playerState);
        mesh.userData.shape = playerState.avatarShape;
        mesh.userData.color = playerState.customColor;
        this.scene.add(mesh);
        this.playerMeshes.set(id, mesh);
      } else if (mesh.userData.color !== playerState.customColor) {
        // Just update color
        const color = new THREE.Color(playerState.customColor || (playerState.team === 1 ? TEAM_COLORS.team1 : TEAM_COLORS.team2));
        const body = mesh.getObjectByName('body') as THREE.Mesh;
        if (body) {
          (body.material as THREE.MeshPhysicalMaterial).color.copy(color);
          (body.material as THREE.MeshPhysicalMaterial).emissive.copy(color);
        }
        const ring = mesh.getObjectByName('ring') as THREE.Mesh;
        if (ring) (ring.material as THREE.MeshBasicMaterial).color.copy(color);
        mesh.userData.color = playerState.customColor;
      }
      
      // Interpolate position
      mesh.position.lerp(this.scratchVector.set(...playerState.position), 0.2);

      // Apply Visual Effects
      let radiusMult = 1.0;
      let hasShield = false;
      playerState.effects.forEach(e => {
        if (e.type === 'size') radiusMult = 1.6;
        if (e.type === 'shield') hasShield = true;
      });

      mesh.scale.setScalar(THREE.MathUtils.damp(mesh.scale.x, radiusMult, 2, deltaSeconds));
      const shield = mesh.getObjectByName('shield');
      if (shield) {
        shield.visible = hasShield;
        if (hasShield) {
          (shield as THREE.Mesh).rotation.y += 0.05;
        }
      }
    }

    // Update Power-ups
    state.powerUps.forEach(pu => {
      let mesh = this.powerUpMeshes.get(pu.id);
      if (pu.active) {
        if (!mesh) {
          mesh = createPowerUpMesh(pu.type);
          this.scene.add(mesh);
          this.powerUpMeshes.set(pu.id, mesh);
        }
        mesh.position.set(...pu.position);
        mesh.rotation.y += 0.02;
        mesh.rotation.x += 0.01;
      } else if (mesh) {
        this.scene.remove(mesh);
        disposeObject3D(mesh);
        this.powerUpMeshes.delete(pu.id);
      }
    });

    // Remove old power-up meshes
    this.powerUpMeshes.forEach((mesh, id) => {
      if (!state.powerUps.find(p => p.id === id)) {
        this.scene.remove(mesh);
        disposeObject3D(mesh);
        this.powerUpMeshes.delete(id);
      }
    });

    // Update Dynamic Light Probes (pulsing in sync with audio tempo & match kinetics)
    const probes = state.lightProbes || [];
    probes.forEach(probe => {
      let probeObj = this.probeMeshes.get(probe.id);
      if (!probeObj) {
        probeObj = createLightProbeMesh(probe);
        this.probeGroup.add(probeObj.group);
        this.probeMeshes.set(probe.id, probeObj);
      }

      // Smoothly ramp point light intensity in sync with audio beat & proximity surge
      const targetLightIntensity = probe.intensity * 2.2;
      probeObj.light.intensity = THREE.MathUtils.damp(probeObj.light.intensity, targetLightIntensity, 8, deltaSeconds);

      // Emissive core pulsing
      const coreMat = probeObj.core.material as THREE.MeshStandardMaterial;
      coreMat.emissiveIntensity = THREE.MathUtils.damp(coreMat.emissiveIntensity, probe.intensity * 1.8, 8, deltaSeconds);

      // Kinetic gyro ring rotations (spinning in sync with probe intensity)
      const speedFactor = 1.0 + Math.min(probe.intensity, 3.0) * 0.6;
      probeObj.ring1.rotation.x += 0.02 * speedFactor;
      probeObj.ring1.rotation.y += 0.025 * speedFactor;
      probeObj.ring2.rotation.y -= 0.02 * speedFactor;
      probeObj.ring2.rotation.z += 0.015 * speedFactor;

      // Subtle breathing scale on the crystalline core
      const pulseScale = 1.0 + Math.sin(state.time * 6 + probe.pulsePhase) * 0.12 * Math.min(probe.intensity, 2.0);
      probeObj.core.scale.setScalar(pulseScale);
    });

    // Remove obsolete light probes
    this.probeMeshes.forEach((probeObj, id) => {
      if (!probes.find(p => p.id === id)) {
        this.probeGroup.remove(probeObj.group);
        disposeObject3D(probeObj.group);
        this.probeMeshes.delete(id);
      }
    });

    // Camera handling
    if (this.highlightTimer > 0) {
      this.highlightTimer -= deltaSeconds;
      if (this.highlightTarget) {
        // Slow-mo zoom
        const zoomPos = this.highlightTarget.clone().add(new THREE.Vector3(0, 2, 8 * Math.sign(this.highlightTarget.z)));
        this.camera.position.lerp(zoomPos, 0.05);
        this.camera.lookAt(this.highlightTarget);
      }
    } else if (customCameraMode === 'orbit') {
      const angle = state.time * 0.2;
      const radius = 38;
      const camX = Math.sin(angle) * radius;
      const camZ = Math.cos(angle) * radius;
      const camY = 14 + Math.sin(angle * 0.5) * 4;
      this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.08);
      this.camera.lookAt(0, 0, 0);
    } else if (customCameraMode === 'disc') {
      const targetCamPos = new THREE.Vector3(
        state.disc.position[0],
        state.disc.position[1] + 8,
        state.disc.position[2] + 22
      );
      this.camera.position.lerp(targetCamPos, 0.1);
      this.camera.lookAt(new THREE.Vector3(...state.disc.position));
    } else {
      const localPlayer = state.players[myId];
      if (state.status === 'playing' && localPlayer && !localPlayer.isSpectator) {
        // Normal camera follow for active player
        const targetCamPos = new THREE.Vector3(
          localPlayer.position[0],
          localPlayer.position[1] + 5,
          localPlayer.position[2] + 15
        );
        this.camera.position.lerp(targetCamPos, 0.1);
        this.camera.lookAt(new THREE.Vector3(...localPlayer.position));
      } else if (state.status === 'playing') {
        // Spectator or disconnected player: Follow the disc
        const targetCamPos = new THREE.Vector3(
          state.disc.position[0],
          state.disc.position[1] + 8,
          state.disc.position[2] + 20
        );
        this.camera.position.lerp(targetCamPos, 0.05);
        this.camera.lookAt(new THREE.Vector3(...state.disc.position));
      } else {
        // Menu / Lobby / Game Over: Gentle cinematic orbit
        const angle = state.time * 0.15;
        const radius = 36;
        const camX = Math.sin(angle) * radius;
        const camZ = Math.cos(angle) * radius;
        const camY = 12 + Math.sin(angle * 0.5) * 4;
        this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.04);
        this.camera.lookAt(0, 0, 0);
      }
    }

    // Update Dynamic Lighting
    if (this.ambientLight && this.mainLight) {
      // Time of Day Simulation (Cyclic)
      const cycleTime = 120; // 2 minutes cycle
      const timeFactor = (Math.sin((state.time / cycleTime) * Math.PI * 2) + 1) / 2; // 0 to 1
      
      // Match Intensity Factor (Disc Speed)
      const v = state.disc.velocity;
      const speed = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
      const intensityFactor = Math.min(speed / 2.0, 1.0); // 0 to 1

      // Combine factors
      // Base intensity ranges from 0.2 (night) to 0.7 (day)
      const baseAmbient = 0.2 + (timeFactor * 0.4);
      // Intensity boost from match action
      const actionBoost = intensityFactor * 0.3;
      
      this.ambientLight.intensity = THREE.MathUtils.damp(this.ambientLight.intensity, baseAmbient + actionBoost, 2, deltaSeconds);
      this.mainLight.intensity = THREE.MathUtils.damp(this.mainLight.intensity, 0.5 + (timeFactor * 0.5) + actionBoost, 2, deltaSeconds);

      // Adjust Fog density based on "time of day"
      if (this.scene.fog instanceof THREE.Fog) {
        this.scene.fog.far = THREE.MathUtils.damp(this.scene.fog.far, 50 + (timeFactor * 100), 2, deltaSeconds);
      }
    }

    // Remove players who left
    this.playerMeshes.forEach((mesh, id) => {
      if (!state.players[id]) {
        this.scene.remove(mesh);
        disposeObject3D(mesh);
        this.playerMeshes.delete(id);
      }
    });
  }

  public render() {
    this.composer.render();
  }

  private onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  public dispose() {
    window.removeEventListener('resize', this.onResize);
    disposeObject3D(this.scene);
    this.scene.environment?.dispose();
    this.probeMeshes.clear();
    this.playerMeshes.clear();
    this.powerUpMeshes.clear();
    this.composer.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
