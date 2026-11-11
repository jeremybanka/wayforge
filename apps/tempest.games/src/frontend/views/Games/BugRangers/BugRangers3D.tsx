import { myRoomKeySelector } from "@atom.io/realtime/client"
import type { Children } from "@atom.io/spa"
import { useGetter } from "@atom.io/spa"
import { AmbientLight, Canvas, DirectionalLight } from "@atom.io/spa/three"
import { ACESFilmicToneMapping, SRGBColorSpace } from "three"
import { OrbitControls } from "three-stdlib"

import { usePullSelector } from "../../../services/realtime-hooks"
import {
	cameraTargetAtom,
	controlsEnabledAtom,
	playableZonesVisibleSelector,
	playerToolsVisibleSelector,
} from "./bug-rangers-client-state"
import css from "./BugRangers3D.module.css"
import { createCameraSpring } from "./camera-spring"
import { HexGridHelper } from "./HexGridHelper"
import { PlayerTools } from "./PlayerTools"
import { gameCamera, gamePointer } from "./scene-state"
import { GameTiles, PlayableZones } from "./TilesAndZones"

// Canvas publishes a stable native canvas root for component-owned styling.
const canvas = { Scene: Canvas }

export function BugRangers3D(): Children {
	const target = useGetter(cameraTargetAtom)
	const enabled = useGetter(controlsEnabledAtom)
	const spring = createCameraSpring(target())
	let controls: OrbitControls | undefined
	return (
		<bug-rangers3-d
			className={css.class}
			onPointerMove={(event) => {
				const bounds = event.currentTarget
					.querySelector(`canvas`)!
					.getBoundingClientRect()
				gamePointer.set(
					((event.clientX - bounds.left) / bounds.width) * 2 - 1,
					(-(event.clientY - bounds.top) / bounds.height) * 2 + 1,
				)
			}}
		>
			<canvas.Scene
				camera={gameCamera}
				width={window.innerWidth}
				height={window.innerHeight}
				rendererOptions={{ alpha: true, powerPreference: `high-performance` }}
				dpr={[1, 2]}
				onCreated={({ renderer }) => {
					renderer.outputColorSpace = SRGBColorSpace
					renderer.toneMapping = ACESFilmicToneMapping
					const orbit = new OrbitControls(gameCamera, renderer.domElement)
					orbit.enableDamping = true
					orbit.dampingFactor = 0.05
					orbit.target.set(...target())
					orbit.update()
					controls = orbit
					return () => {
						orbit.dispose()
					}
				}}
				onResize={({ width, height }) => {
					gameCamera.aspect = width / height
					gameCamera.updateProjectionMatrix()
				}}
				onFrame={({ delta }) => {
					if (!controls) return
					controls.enabled = enabled()
					const animatedTarget = spring.advance(target(), delta)
					if (animatedTarget) controls.target.lerp(animatedTarget, 0.2)
					if (controls.enabled || animatedTarget) controls.update()
				}}
			>
				<AmbientLight intensity={0.5} />
				<DirectionalLight position={[5, 10, 5]} />
				<HexGridHelper size={20} radius={1} color="#6f6f6f" opacity={0.5} />
				<BugRangersExterior3D />
			</canvas.Scene>
		</bug-rangers3-d>
	)
}
function BugRangersExterior3D(): Children {
	const room = useGetter(myRoomKeySelector)
	return <>{room() ? <BugRangersInterior3D key={room()} /> : null}</>
}
function BugRangersInterior3D(): Children {
	const zones = usePullSelector(playableZonesVisibleSelector)
	const tools = usePullSelector(playerToolsVisibleSelector)
	return (
		<>
			<GameTiles />
			{zones() ? <PlayableZones /> : null}
			{tools() ? <PlayerTools /> : null}
		</>
	)
}
