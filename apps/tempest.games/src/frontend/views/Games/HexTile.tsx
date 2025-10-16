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
