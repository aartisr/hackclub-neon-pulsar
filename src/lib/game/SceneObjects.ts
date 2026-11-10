import * as THREE from 'three';
import type { PlayerState, LightProbeState } from '../../types/game';
import { ARENA_SIZE, TEAM_COLORS, PLAYER_RADIUS, DISC_RADIUS } from './Constants';

export function createArena(): THREE.Group {
  const group = new THREE.Group();

  // Grid floor
  const gridHelper = new THREE.GridHelper(100, 20, 0x444444, 0x222222);
  gridHelper.position.y = -ARENA_SIZE.height / 2;
  group.add(gridHelper);

  // Walls (Neon Wireframe)
  const boxGeom = new THREE.BoxGeometry(ARENA_SIZE.width, ARENA_SIZE.height, ARENA_SIZE.depth);
  const edges = new THREE.EdgesGeometry(boxGeom);
  boxGeom.dispose();
  const lineMat = new THREE.LineBasicMaterial({ color: 0x333333 });
  const wireframe = new THREE.LineSegments(edges, lineMat);
  group.add(wireframe);

  // Goals
  const goalGeom = new THREE.PlaneGeometry(10, 10);
  const goal1Mat = new THREE.MeshBasicMaterial({ color: TEAM_COLORS.team2, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
  const goal1 = new THREE.Mesh(goalGeom, goal1Mat);
  goal1.position.z = -ARENA_SIZE.depth / 2 + 0.1;
  group.add(goal1);

  const goal2Mat = new THREE.MeshBasicMaterial({ color: TEAM_COLORS.team1, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
  const goal2 = new THREE.Mesh(goalGeom, goal2Mat);
  goal2.position.z = ARENA_SIZE.depth / 2 - 0.1;
  group.add(goal2);

  return group;
}

export function createDisc(): THREE.Mesh {
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

export function createPlayerMesh(player: PlayerState): THREE.Group {
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

export function createPowerUpMesh(type: string): THREE.Mesh {
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

export function createLightProbeMesh(probe: LightProbeState): {
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

export function disposeObject3D(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse(object => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line) {
      geometries.add(object.geometry);
      const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
      objectMaterials.forEach(material => materials.add(material));
    }
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
}
