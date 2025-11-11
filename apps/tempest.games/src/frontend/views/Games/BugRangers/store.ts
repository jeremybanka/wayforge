import { atom } from "atom.io"
import type * as THREE from "three"

export const cameraTargetAtom = atom<[x: number, y: number, z: number]>({
	key: `cameraTarget`,
	default: [0, 0, 0],
})

export const controlsEnabledAtom = atom<boolean>({
	key: `controlsEnabled`,
	default: true,
})

export type ProbeState = `dragging` | `idle` | `returning`

export const probeStateAtom = atom<ProbeState>({
	key: `probeState`,
	default: `idle`,
})

export const cameraAnchoredSphereAtom = atom<THREE.Mesh | null>({
	key: `cameraAnchoredSphere`,
	default: null,
})
