// HexGridHelper.tsx — drop-in alternative to <gridHelper /> that draws a hexagonal grid on the XZ plane
// Usage:
// <Canvas camera={{ position: [8, 8, 8], fov: 45 }}>
//   <ambientLight intensity={0.5} />
//   <OrbitControls makeDefault />
//   <HexGridHelper size={20} radius={1} color="#6f6f6f" opacity={0.5} />
// </Canvas>

import * as React from "react"
import * as THREE from "three"

/**
 * HexGridHelper
 *
 * Renders a flat-top hexagonal grid similar to three.js's GridHelper, lying on the XZ plane at y=0.
 *
 * Props
 * - size: half-extent of the grid (units). Grid spans roughly [-size, +size] on X and Z.
 * - radius: hexagon circumradius (distance from center to a vertex).
 * - color: line color.
 * - opacity: line opacity (0..1). Set < 1 to get a subtle grid.
 * - y: height at which to place the grid (default 0).
 * - dashed: if true, uses LineDashedMaterial. (Dash scale is auto-computed.)
 *
 * Notes
 * - This creates a single merged BufferGeometry of all hex outlines for good performance.
 * - For very large sizes with tiny radii, the segment count can explode; tweak `radius`/`size` accordingly.
 */
export function HexGridHelper({
	size = 10,
	radius = 1,
	color = `#808080`,
	opacity = 0.75,
	y = 0,
	dashed = false,
}: {
	size?: number
	radius?: number
	color?: THREE.ColorRepresentation
	opacity?: number
	y?: number
	dashed?: boolean
}): React.ReactNode {
	const ref = React.useRef<THREE.LineSegments>(null)

	const { geometry, dashSize, gapSize } = React.useMemo(() => {
		// --- math helpers for flat-top hexes ---
		// const TAU = Math.PI * 2
		const angles = [0, 60, 120, 180, 240, 300].map((a) => (a * Math.PI) / 180)
		const cos = (a: number) => Math.cos(a)
		const sin = (a: number) => Math.sin(a)

		// axial (q, r) -> world (x, z) for flat-top hex layout
		const axialToXZ = (q: number, r: number) => {
			const x = radius * (1.5 * q)
			const z = radius * (Math.sqrt(3) * (r + q / 2))
			return new THREE.Vector2(x, z)
		}

		// compute bounds in axial space that cover the requested square-ish extent in world space
		const maxQ = Math.ceil((size * 2) / (1.5 * radius))
		const maxR = Math.ceil((size * 2) / (Math.sqrt(3) * radius))

		// Prebuild one unit hex (6 vertices) around origin in XZ plane
		const unit = angles.map(
			(a) => new THREE.Vector3(radius * cos(a), 0, radius * sin(a)),
		)

		// We'll push segment endpoints (two points per edge) for each hex
		const positions: number[] = []

		for (let q = -maxQ; q <= maxQ; q++) {
			for (let r = -maxR; r <= maxR; r++) {
				const c = axialToXZ(q, r)
				// Cull hexes outside the square-ish world bounds to limit segment count
				if (Math.abs(c.x) > size + radius || Math.abs(c.y) > size + radius)
					continue

				// Translate unit hex to this center
				for (let i = 0; i < 6; i++) {
					const a = unit[i]
					const b = unit[(i + 1) % 6]
					positions.push(a.x + c.x, 0, a.z + c.y)
					positions.push(b.x + c.x, 0, b.z + c.y)
				}
			}
		}

		const _geometry = new THREE.BufferGeometry()
		_geometry.setAttribute(
			`position`,
			new THREE.Float32BufferAttribute(positions, 3),
		)
		_geometry.computeBoundingSphere()

		// Reasonable dashed defaults relative to radius
		const _dashSize = radius * 0.6
		const _gapSize = radius * 0.6

		return { geometry: _geometry, dashSize: _dashSize, gapSize: _gapSize }
	}, [size, radius])

	const material = React.useMemo(() => {
		if (dashed) {
			const m = new THREE.LineDashedMaterial({
				color,
				transparent: opacity < 1,
				opacity,
				dashSize,
				gapSize,
			})
			return m
		}
		return new THREE.LineBasicMaterial({
			color,
			transparent: opacity < 1,
			opacity,
		})
	}, [color, opacity, dashed])

	// If dashed, compute line distances once
	React.useLayoutEffect(() => {
		if (!ref.current) return
		if (ref.current.material instanceof THREE.LineDashedMaterial) {
			const g = ref.current.geometry
			// Add cumulative distance along each segment for dashed rendering
			const pos = g.getAttribute(`position`) as THREE.BufferAttribute
			const lineDistances = new Float32Array(pos.count)
			for (let i = 0; i < pos.count; i += 2) {
				const ax = pos.getX(i)
				const ay = pos.getY(i)
				const az = pos.getZ(i)
				const bx = pos.getX(i + 1)
				const by = pos.getY(i + 1)
				const bz = pos.getZ(i + 1)
				const d = Math.hypot(bx - ax, by - ay, bz - az)
				lineDistances[i] = 0
				lineDistances[i + 1] = d
			}
			g.setAttribute(`lineDistance`, new THREE.BufferAttribute(lineDistances, 1))
			ref.current.material.needsUpdate = true
		}
	}, [])

	return (
		<group position-y={y} rotation-x={-Math.PI * 0}>
			{/* A tiny offset to avoid z-fighting if you also keep a plane at y=0 */}
			<lineSegments
				ref={ref}
				geometry={geometry}
				position={[0, y + 0.0001, 0]}
				rotation={[/*-Math.PI / 2*/ 0, 0, 0]} // lay on XZ like GridHelper
				material={material}
			/>
		</group>
	)
}
