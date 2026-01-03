import { useO } from "atom.io/react"
import type { UserKey } from "atom.io/realtime"
import type { ReactNode, Ref } from "react"
import * as THREE from "three"

import { playerColorAtoms } from "../../../../library/bug-rangers-game-state"

export type CubeTokenStackProps = {
	position: THREE.Vector3
	count: number
	ownerKey: UserKey
}
export function CubeTokenStack({
	position: [x, y, z],
	count,
	ownerKey,
}: CubeTokenStackProps): ReactNode {
	const layers: (1 | 2 | 3 | 4)[] = []
	while (count > 0) {
		if (count >= 4) {
			layers.push(4)
			count -= 4
		} else {
			layers.push(count as 1 | 2 | 3)
			count = 0
		}
	}

	return (
		<>
			{layers.map((layerCount, i) => (
				<CubeTokenLayer
					key={i}
					position={new THREE.Vector3(x, y + i * 0.5, z)}
					count={layerCount}
					rotation={new THREE.Euler(0, (i * Math.PI) / 3, 0)}
					ownerKey={ownerKey}
				/>
			))}
		</>
	)
}
export type CubeTokenLayerProps = {
	position: THREE.Vector3
	rotation: THREE.Euler
	count: 1 | 2 | 3 | 4
	ownerKey: UserKey
}
export function CubeTokenLayer({
	position,
	rotation: rOffset,
	count,
	ownerKey,
}: CubeTokenLayerProps): ReactNode {
	const radius = count * 0.1 + 0.1
	const color = useO(playerColorAtoms, ownerKey) ?? `#555`
	return (
		<group position={position} rotation={rOffset}>
			{count === 1 ? (
				<CubeToken
					color={color}
					position={new THREE.Vector3(0, 0, 0)}
					rotation={new THREE.Euler(0, 0, 0)}
				/>
			) : (
				Array.from({ length: count }).map((_, i) => {
					const angle = (i / count) * Math.PI * 2
					const x = Math.cos(angle) * radius
					const z = Math.sin(angle) * radius

					const rotation = new THREE.Euler(0, (Math.PI * 3) / 2 - angle, 0)

					return (
						<CubeToken
							key={i}
							color={color}
							position={new THREE.Vector3(x, 0, z)}
							rotation={rotation}
						/>
					)
				})
			)}
		</group>
	)
}

export type CubeTokenProps = {
	ref?: Ref<THREE.Mesh>
	color?: THREE.ColorRepresentation
	position?: THREE.Vector3
	rotation?: THREE.Euler
	onPointerDown?: (position: THREE.Vector3) => void
	onPointerUp?: (position: THREE.Vector3) => void
}
export function CubeToken(props: CubeTokenProps): ReactNode {
	return (
		<mesh {...props} receiveShadow>
			<boxGeometry args={[0.5, 0.5, 0.5]} />
			<meshStandardMaterial color={props.color ?? `hotpink`} />
		</mesh>
	)
}
