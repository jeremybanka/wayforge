import { useFrame, useThree } from "@react-three/fiber"
import { getState, setState } from "atom.io"
import { useAtomicRef, useI } from "atom.io/react"
import type { ReactNode } from "react"
import { useRef } from "react"
import * as THREE from "three"

import { HexTile } from "./HexTile"
import {
	cameraAnchoredSphereAtom,
	controlsEnabledAtom,
	dragpointAtom,
	probeStateAtom,
} from "./store"

const forward = new THREE.Vector3()
const right = new THREE.Vector3()
const upWorld = new THREE.Vector3(0, 1, 0)
const upCam = new THREE.Vector3()
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

const distForward = 10
const offsetRight = -2
const offsetUp = 1
const hitPoint = new THREE.Vector3()

export function PlayerTools(): ReactNode {
	const ref = useAtomicRef(cameraAnchoredSphereAtom, useRef)
	const { camera, raycaster, pointer } = useThree()
	const setControlsEnabled = useI(controlsEnabledAtom)

	const startDrag = () => {
		setControlsEnabled(false)
		setState(probeStateAtom, `dragging`)
	}

	const endDrag = () => {
		setControlsEnabled(true)
		setState(probeStateAtom, `returning`)
		setState(dragpointAtom, null)
	}

	useFrame(() => {
		if (!ref.current) return
		const probeState = getState(probeStateAtom)

		switch (probeState) {
			case `idle`:
			case `returning`:
				// Forward vector
				camera.getWorldDirection(forward) // normalized

				// Right vector (forward × worldUp)
				right.copy(forward).cross(upWorld).normalize()

				// Camera-up vector (right × forward)
				upCam.copy(right).cross(forward).normalize()

				// Move the sphere
				ref.current.position.copy(
					camera.position
						.clone()
						.add(forward.multiplyScalar(distForward))
						.add(right.multiplyScalar(offsetRight))
						.add(upCam.multiplyScalar(-offsetUp)),
				)
				break
			case `dragging`:
				raycaster.setFromCamera(pointer, camera)
				if (raycaster.ray.intersectPlane(plane, hitPoint)) {
					setState(dragpointAtom, hitPoint)
					ref.current.position.copy(hitPoint)
				}
		}
	})

	return <HexTile ref={ref} onPointerDown={startDrag} onPointerUp={endDrag} />
}
