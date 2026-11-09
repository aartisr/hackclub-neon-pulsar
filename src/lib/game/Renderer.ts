import * as THREE from 'three';
import { EffectComposer, RenderPass, UnrealBloomPass, RoomEnvironment } from 'three-stdlib';
import { GameState, PlayerState, LightProbeState } from '../network/PeerManager';
import { ARENA_SIZE, TEAM_COLORS, PLAYER_RADIUS, DISC_RADIUS } from './Constants';

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
    this.scene.environment = pmremGenerator.fromScene(new (RoomEnvironment as any)(), 0.04).texture;
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
    this.arena = this.createArena();
    this.scene.add(this.arena);

    // Dynamic Light Probes Group
    this.probeGroup = new THREE.Group();
    this.scene.add(this.probeGroup);

    // Disc
    this.discMesh = this.createDisc();
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

  private createArena(): THREE.Group {
    const group = new THREE.Group();
    
    // Grid floor
    const gridHelper = new THREE.GridHelper(100, 20, 0x444444, 0x222222);
    gridHelper.position.y = -ARENA_SIZE.height / 2;
    group.add(gridHelper);

    // Walls (Neon Wireframe)
    const boxGeom = new THREE.BoxGeometry(ARENA_SIZE.width, ARENA_SIZE.height, ARENA_SIZE.depth);
    const edges = new THREE.EdgesGeometry(boxGeom);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x333333 });
    const wireframe = new THREE.LineSegments(edges, lineMat);
    group.add(wireframe);

    // Goals
    const goalGeom = new THREE.PlaneGeometry(10, 10);
    const goal1Mat = new THREE.MeshBasicMaterial({ color: TEAM_COLORS.team1, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
    const goal1 = new THREE.Mesh(goalGeom, goal1Mat);
    goal1.position.z = -ARENA_SIZE.depth / 2 + 0.1;
    group.add(goal1);

    const goal2Mat = new THREE.MeshBasicMaterial({ color: TEAM_COLORS.team2, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
    const goal2 = new THREE.Mesh(goalGeom, goal2Mat);
    goal2.position.z = ARENA_SIZE.depth / 2 - 0.1;
    group.add(goal2);

    return group;
  }

  private createDisc(): THREE.Mesh {
    const geom = new THREE.SphereGeometry(DISC_RADIUS, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 2,
      metalness: 0.9,
      roughness: 0.1
    });
    return new THREE.Mesh(geom, mat);
  }

  private createPlayerMesh(player: PlayerState): THREE.Group {
    const group = new THREE.Group();
    const baseColor = player.team === 1 ? TEAM_COLORS.team1 : TEAM_COLORS.team2;
    const finalColor = player.customColor ? new THREE.Color(player.customColor) : new THREE.Color(baseColor);

    // Body Geometry based on shape
    let bodyGeom: THREE.BufferGeometry;
    switch (player.avatarShape) {
      case 'cube':
        bodyGeom = new THREE.BoxGeometry(PLAYER_RADIUS * 1.2, PLAYER_RADIUS * 1.2, PLAYER_RADIUS * 1.2);
        break;
      case 'sphere':
        bodyGeom = new THREE.SphereGeometry(PLAYER_RADIUS, 16, 16);
        break;
      case 'octa':
        bodyGeom = new THREE.OctahedronGeometry(PLAYER_RADIUS);
        break;
      case 'capsule':
      default:
        bodyGeom = new THREE.CapsuleGeometry(PLAYER_RADIUS * 0.8, PLAYER_RADIUS, 4, 8);
        break;
    }

    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: finalColor,
      emissive: finalColor,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.name = 'body';
    group.add(body);

    // Visor
    const visorGeom = new THREE.SphereGeometry(PLAYER_RADIUS * 0.4, 8, 8);
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 1, roughness: 0 });
    const visor = new THREE.Mesh(visorGeom, visorMat);
    visor.position.set(0, 0.5, 0.5);
    visor.scale.set(1.5, 0.6, 1);
    group.add(visor);

    // Glow Ring
    const ringGeom = new THREE.TorusGeometry(PLAYER_RADIUS * 0.9, 0.05, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: finalColor });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.name = 'ring';
    group.add(ring);

    // Shield (Initially hidden)
    const shieldGeom = new THREE.SphereGeometry(PLAYER_RADIUS * 1.5, 16, 16);
    const shieldMat = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const shield = new THREE.Mesh(shieldGeom, shieldMat);
    shield.name = 'shield';
    shield.visible = false;
    group.add(shield);

    return group;
  }

  private createPowerUpMesh(type: string): THREE.Mesh {
    const geom = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    let color = 0xffff00;
    if (type === 'speed') color = 0x00ff00;
    if (type === 'size') color = 0x0000ff;
    if (type === 'shield') color = 0x00ffff;

    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.8
    });
    return new THREE.Mesh(geom, mat);
  }

  private createLightProbeMesh(probe: LightProbeState): {
    group: THREE.Group;
    core: THREE.Mesh;
    ring1: THREE.Mesh;
    ring2: THREE.Mesh;
    light: THREE.PointLight;
  } {
    const group = new THREE.Group();
    const probeColor = new THREE.Color(probe.color);

    // Glowing crystalline core
    const coreGeom = new THREE.OctahedronGeometry(0.65, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: probeColor,
      emissive: probeColor,
      emissiveIntensity: probe.intensity * 1.5,
      roughness: 0.15,
      metalness: 0.85,
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    group.add(core);

    // Outer kinetic gyro ring 1
    const ring1Geom = new THREE.TorusGeometry(1.15, 0.035, 8, 32);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: probeColor,
      transparent: true,
      opacity: 0.75,
    });
    const ring1 = new THREE.Mesh(ring1Geom, ring1Mat);
    group.add(ring1);

    // Outer kinetic gyro ring 2 (angled)
    const ring2Geom = new THREE.TorusGeometry(1.4, 0.025, 8, 32);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: probeColor,
      transparent: true,
      opacity: 0.5,
    });
    const ring2 = new THREE.Mesh(ring2Geom, ring2Mat);
    ring2.rotation.x = Math.PI / 3;
    group.add(ring2);

    // Real-time PointLight casting dynamic glow across arena boundaries
    const light = new THREE.PointLight(probeColor, probe.intensity * 2.2, probe.range || 20, 2);
    group.add(light);

    group.position.set(...probe.position);
    return { group, core, ring1, ring2, light };
  }

  public update(state: GameState, myId: string) {
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
          this.scene.remove(this.playerMeshes.get(id)!);
          this.playerMeshes.delete(id);
        }
        continue;
      }

      let mesh = this.playerMeshes.get(id);
      
      if (!mesh || mesh.userData.shape !== playerState.avatarShape) {
        if (mesh) this.scene.remove(mesh);
        mesh = this.createPlayerMesh(playerState);
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
      mesh.position.lerp(new THREE.Vector3(...playerState.position), 0.2);

      // Apply Visual Effects
      let radiusMult = 1.0;
      let hasShield = false;
      playerState.effects.forEach(e => {
        if (e.type === 'size') radiusMult = 1.6;
        if (e.type === 'shield') hasShield = true;
      });

      mesh.scale.setScalar(THREE.MathUtils.damp(mesh.scale.x, radiusMult, 2, 0.016));
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
          mesh = this.createPowerUpMesh(pu.type);
          this.scene.add(mesh);
          this.powerUpMeshes.set(pu.id, mesh);
        }
        mesh.position.set(...pu.position);
        mesh.rotation.y += 0.02;
        mesh.rotation.x += 0.01;
      } else if (mesh) {
        this.scene.remove(mesh);
        this.powerUpMeshes.delete(pu.id);
      }
    });

    // Remove old power-up meshes
    this.powerUpMeshes.forEach((mesh, id) => {
      if (!state.powerUps.find(p => p.id === id)) {
        this.scene.remove(mesh);
        this.powerUpMeshes.delete(id);
      }
    });

    // Update Dynamic Light Probes (pulsing in sync with audio tempo & match kinetics)
    const probes = state.lightProbes || [];
    probes.forEach(probe => {
      let probeObj = this.probeMeshes.get(probe.id);
      if (!probeObj) {
        probeObj = this.createLightProbeMesh(probe);
        this.probeGroup.add(probeObj.group);
        this.probeMeshes.set(probe.id, probeObj);
      }

      // Smoothly ramp point light intensity in sync with audio beat & proximity surge
      const targetLightIntensity = probe.intensity * 2.2;
      probeObj.light.intensity = THREE.MathUtils.damp(probeObj.light.intensity, targetLightIntensity, 8, 0.016);

      // Emissive core pulsing
      const coreMat = probeObj.core.material as THREE.MeshStandardMaterial;
      coreMat.emissiveIntensity = THREE.MathUtils.damp(coreMat.emissiveIntensity, probe.intensity * 1.8, 8, 0.016);

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
        probeObj.core.geometry.dispose();
        (probeObj.core.material as THREE.Material).dispose();
        probeObj.ring1.geometry.dispose();
        (probeObj.ring1.material as THREE.Material).dispose();
        probeObj.ring2.geometry.dispose();
        (probeObj.ring2.material as THREE.Material).dispose();
        this.probeMeshes.delete(id);
      }
    });

    // Camera handling
    if (this.highlightTimer > 0) {
      this.highlightTimer -= 0.016; // Approx 60fps
      if (this.highlightTarget) {
        // Slow-mo zoom
        const zoomPos = this.highlightTarget.clone().add(new THREE.Vector3(0, 2, 8 * Math.sign(this.highlightTarget.z)));
        this.camera.position.lerp(zoomPos, 0.05);
        this.camera.lookAt(this.highlightTarget);
      }
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
      
      this.ambientLight.intensity = THREE.MathUtils.damp(this.ambientLight.intensity, baseAmbient + actionBoost, 2, 0.016);
      this.mainLight.intensity = THREE.MathUtils.damp(this.mainLight.intensity, 0.5 + (timeFactor * 0.5) + actionBoost, 2, 0.016);

      // Adjust Fog density based on "time of day"
      if (this.scene.fog instanceof THREE.Fog) {
        this.scene.fog.far = THREE.MathUtils.damp(this.scene.fog.far, 50 + (timeFactor * 100), 2, 0.016);
      }
    }

    // Remove players who left
    this.playerMeshes.forEach((mesh, id) => {
      if (!state.players[id]) {
        this.scene.remove(mesh);
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
    this.probeMeshes.forEach(probeObj => {
      this.probeGroup.remove(probeObj.group);
      probeObj.core.geometry.dispose();
      (probeObj.core.material as THREE.Material).dispose();
      probeObj.ring1.geometry.dispose();
      (probeObj.ring1.material as THREE.Material).dispose();
      probeObj.ring2.geometry.dispose();
      (probeObj.ring2.material as THREE.Material).dispose();
    });
    this.probeMeshes.clear();
    this.renderer.dispose();
    window.removeEventListener('resize', this.onResize);
  }
}
