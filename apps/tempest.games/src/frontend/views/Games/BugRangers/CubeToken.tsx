import type { UserKey } from "@atom.io/realtime"
import type { Children } from "@atom.io/spa"
import { useGetter } from "@atom.io/spa"
import {
	BoxGeometry,
	Group,
	Mesh,
	MeshStandardMaterial,
} from "@atom.io/spa/three"
import * as THREE from "three"

import { playerColorAtoms } from "../../../../library/bug-rangers-game-state"

export type CubeTokenStackProps = {
	position: THREE.Vector3
	count: number
	key: UserKey
}
export function CubeTokenStack(props: CubeTokenStackProps): Children {
	return (
		<>
			{Array.from({ length: Math.ceil(props.count / 4) }, (_, i) => (
				<CubeTokenLayer
					key={[props.key, i]}
					position={
						new THREE.Vector3(
							props.position.x,
							props.position.y + i * 0.5,
							props.position.z,
						)
					}
					count={Math.min(4, props.count - i * 4)}
					rotation={new THREE.Euler(0, (i * Math.PI) / 3, 0)}
				/>
			))}
		</>
	)
}
type CubeTokenLayerProps = {
	position: THREE.Vector3
	rotation: THREE.Euler
	count: number
	key: readonly [UserKey, number]
}
function CubeTokenLayer(props: CubeTokenLayerProps): Children {
	const color = useGetter(playerColorAtoms, props.key[0])
	return (
		<Group
			position={[props.position.x, props.position.y, props.position.z]}
			rotation={[props.rotation.x, props.rotation.y, props.rotation.z]}
		>
			{Array.from({ length: props.count }, (_, i) => {
				const angle = (i / props.count) * Math.PI * 2
				const radius = props.count === 1 ? 0 : props.count * 0.1 + 0.1
				return (
					<CubeToken
						key={i}
						color={color() ?? `#555`}
						position={
							new THREE.Vector3(
								Math.cos(angle) * radius,
								0,
								Math.sin(angle) * radius,
							)
						}
						rotation={
							new THREE.Euler(
								0,
								props.count === 1 ? 0 : Math.PI * 1.5 - angle,
								0,
							)
						}
					/>
				)
			})}
		</Group>
	)
}
export type CubeTokenProps = {
	ref?: (mesh: THREE.Mesh | null) => void
	color?: THREE.ColorRepresentation
	position?: THREE.Vector3
	rotation?: THREE.Euler
	onPointerDown?: (position: THREE.Vector3) => void
	onPointerUp?: (position: THREE.Vector3) => void
	onPointerCancel?: () => void
}
export function CubeToken(props: CubeTokenProps): Children {
	return (
		<Mesh
			ref={(node) => props.ref?.(node)}
			position={
				props.position
					? [props.position.x, props.position.y, props.position.z]
					: [0, 0, 0]
			}
			rotation={
				props.rotation
					? [props.rotation.x, props.rotation.y, props.rotation.z]
					: [0, 0, 0]
			}
			onPointerDown={(event) => {
				if (props.onPointerDown) {
					event.setPointerCapture()
					event.nativeEvent.stopImmediatePropagation()
				}
				props.onPointerDown?.(event.currentTarget.position)
			}}
			onPointerCancel={() => {
				props.onPointerCancel?.()
			}}
			onPointerUp={(event) => {
				if (event.hasPointerCapture()) event.releasePointerCapture()
				props.onPointerUp?.(event.currentTarget.position)
			}}
		>
			<BoxGeometry args={[0.5, 0.5, 0.5]} />
			<MeshStandardMaterial color={props.color ?? `hotpink`} />
		</Mesh>
	)
}
