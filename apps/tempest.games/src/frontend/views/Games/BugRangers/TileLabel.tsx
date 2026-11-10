import type { Children } from "@atom.io/spa"
import { onCleanup, onMount } from "@atom.io/spa"
import { bindScene } from "@atom.io/spa/renderer"
import { Group } from "@atom.io/spa/three"
import type * as THREE from "three"
import { Text } from "troika-three-text"

/** Use the same SDF geometry, font metrics, and orientation as Drei's Text. */
export function TileLabel(props: {
	position: readonly [number, number, number]
	text: string
}): Children {
	let group: THREE.Object3D | null = null
	onMount(() => {
		const text = new Text()
		text.fontSize = 0.25
		text.anchorX = `center`
		text.anchorY = `middle`
		text.sdfGlyphSize = 64
		text.color = `white`
		group!.add(text)
		bindScene(
			() => props.text,
			(value) => {
				text.text = value
				text.sync()
			},
		)
		onCleanup(() => {
			text.removeFromParent()
			text.dispose()
		})
	})
	return (
		<Group
			position={props.position}
			ref={(node) => {
				group = node
			}}
		/>
	)
}
