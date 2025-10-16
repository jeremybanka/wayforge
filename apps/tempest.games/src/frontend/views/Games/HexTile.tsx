/** biome-ignore-all lint/a11y/noStaticElementInteractions: drei */

import { useMemo } from "react"
import * as THREE from "three"

/**
 * HexTile
 *
 * A short hexagonal prism shaped exactly like one of the hexes in the grid.
 * Props:
 * - radius: circumradius of the hexagon (same as HexGridHelper)
 * - height: thickness of the prism
 * - position: center position
 */
export function HexTile({
	radius = 1,
	height = 0.3,
	position = [0, 0, 0],
	color = `#ee5`,
}: {
	radius?: number
	height?: number
	position?: [number, number, number]
	color?: THREE.ColorRepresentation
}) {
	// Build a hexagonal shape
	const shape = useMemo(() => {
		const s = new THREE.Shape()
		for (let i = 0; i < 6; i++) {
			const angle = (Math.PI / 180) * (60 * i)
			const x = radius * Math.cos(angle)
			const y = radius * Math.sin(angle)
			if (i === 0) s.moveTo(x, y)
			else s.lineTo(x, y)
		}
		s.closePath()
		return s
	}, [radius])

	const geom = useMemo(
		() =>
			new THREE.ExtrudeGeometry(shape, {
				depth: height,
				bevelEnabled: false,
			}),
		[shape, height],
	)

	return (
		<mesh
			geometry={geom}
			position={position}
			rotation={[-Math.PI / 2, 0, 0]}
			castShadow
			receiveShadow
		>
			<meshStandardMaterial color={color} />
		</mesh>
	)
}

export function GameTile({
	coordinates,
	stackHeight = 1,
	color = `#ee5`,
}: {
	coordinates: { x: number; y: number; z: number }
	stackHeight?: 1 | 2 | 3
	color?: THREE.ColorRepresentation
}) {
	const { x: boardA, y: boardB, z: boardC } = coordinates
	if (boardA + boardB + boardC !== 0) {
		console.error(`GameTile: bad coordinates did not add to zero`, coordinates)
		return null
	}

	const unit = Math.sqrt(3)
	const a60 = Math.PI / 3
	const a120 = a60 * 2
	const sin60 = Math.sin(a60)
	const cos60 = Math.cos(a60)
	const sin120 = Math.sin(a120)
	const cos120 = Math.cos(a120)

	const uA = unit * boardA
	const uB = unit * boardB
	const uC = unit * boardC

	const sin60UA = uA * sin60
	const cos60UA = uA * cos60

	const sin120UB = uB * sin120
	const cos120UB = uB * cos120

	const x = sin60UA + sin120UB
	const z = cos60UA + cos120UB + uC

	return (
		<>
			<HexTile position={[x, 0, z]} color={color} />
			{stackHeight > 1 ? (
				<HexTile position={[x, 0.33, z]} color={color} />
			) : null}
			{stackHeight > 2 ? (
				<HexTile position={[x, 0.66, z]} color={color} />
			) : null}
		</>
	)
}
