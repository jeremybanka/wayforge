/** biome-ignore-all lint/a11y/noStaticElementInteractions: drei */

import type { ReactNode } from "react"

export function SelectableObject({
	position,
	color,
	onClick,
}: {
	position: [x: number, y: number, z: number]
	color: string
	onClick: (pos: number[]) => void
}): ReactNode {
	return (
		<mesh
			position={position}
			onClick={() => {
				onClick(position)
			}}
		>
			<boxGeometry args={[1, 1, 1]} />
			<meshStandardMaterial color={color} />
		</mesh>
	)
}
