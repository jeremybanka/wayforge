import type { ReactNode, Ref } from "react"
import type * as THREE from "three"

export type CubeTokenProps = {
	ref?: Ref<THREE.Mesh>
	position?: THREE.Vector3
	onPointerDown?: (position: THREE.Vector3) => void
	onPointerUp?: (position: THREE.Vector3) => void
}
export function CubeToken(props: CubeTokenProps): ReactNode {
	return (
		<mesh {...props} receiveShadow>
			<boxGeometry args={[0.5, 0.5, 0.5]} />
			<meshStandardMaterial color="hotpink" />
		</mesh>
	)
}
