import type { Children } from "@atom.io/spa"
import { onCleanup, onMount } from "@atom.io/spa"
import { bindScene, onSceneFrame } from "@atom.io/spa/renderer"
import { createThreeEvents, threeRenderer } from "@atom.io/spa/three"
import * as THREE from "three"

import css from "./GameCanvas.module.css"

type Frame = { renderer: THREE.WebGLRenderer; delta: number }
/** SPA scene ownership with the renderer settings used by the original R3F canvas. */
export function GameCanvas(props: {
	camera: THREE.PerspectiveCamera
	width: number
	height: number
	children?: Children
	onFrame: (frame: Frame) => void
}): Children {
	let canvas: HTMLCanvasElement | null = null
	onMount(() => {
		const renderer = new THREE.WebGLRenderer({
			canvas: canvas!,
			antialias: true,
			alpha: true,
			powerPreference: `high-performance`,
		})
		renderer.outputColorSpace = THREE.SRGBColorSpace
		renderer.toneMapping = THREE.ACESFilmicToneMapping
		onCleanup(() => {
			renderer.dispose()
			renderer.forceContextLoss()
		})
		const scene = new THREE.Scene()
		bindScene(
			() => [props.width, props.height] as const,
			([width, height]) => {
				renderer.setPixelRatio(Math.min(2, Math.max(1, window.devicePixelRatio)))
				renderer.setSize(width, height)
				props.camera.aspect = width / height
				props.camera.updateProjectionMatrix()
			},
		)
		threeRenderer.mount(() => props.children, scene)
		const events = createThreeEvents(canvas!, scene, () => props.camera)
		onCleanup(() => {
			events.dispose()
		})
		let last: number | undefined
		onSceneFrame((time) => {
			const delta = last === undefined ? 0 : (time - last) / 1000
			last = time
			props.onFrame({ renderer, delta })
			events.update()
			renderer.render(scene, props.camera)
		}, true)
	})
	return (
		<game-canvas className={css.class}>
			<canvas
				ref={(element) => {
					canvas = element
				}}
			/>
		</game-canvas>
	)
}
