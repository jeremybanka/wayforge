import { myRoomKeySelector } from "@atom.io/realtime/client"
import type { Children } from "@atom.io/spa"
import {
	onCleanup,
	onMount,
	useDisposal,
	useGetter,
	useId,
	useSetter,
} from "@atom.io/spa"
import { AmbientLight, Canvas, DirectionalLight } from "@atom.io/spa/three"
import { ACESFilmicToneMapping, SRGBColorSpace } from "three"
import { OrbitControls } from "three-stdlib"

import { usePullSelector } from "../../../services/realtime-hooks"
import {
	cameraTargetAtom,
	controlsEnabledAtom,
	playableZonesVisibleSelector,
	playerToolsVisibleSelector,
	viewportAtoms,
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
	const instanceKey = useId()
	const disposeState = useDisposal()
	const viewport = useGetter(viewportAtoms, instanceKey)
	const setViewport = useSetter(viewportAtoms, instanceKey)
	onCleanup(() => {
		disposeState(viewportAtoms, instanceKey)
	})
	let host: HTMLElement | null = null
	let controls: OrbitControls | undefined
	onMount(() => {
		const resize = () => {
			setViewport([window.innerWidth, window.innerHeight])
		}
		const pointer = (event: PointerEvent) => {
			const bounds = host!.querySelector(`canvas`)!.getBoundingClientRect()
			gamePointer.set(
				((event.clientX - bounds.left) / bounds.width) * 2 - 1,
				(-(event.clientY - bounds.top) / bounds.height) * 2 + 1,
			)
		}
		window.addEventListener(`resize`, resize)
		host!.addEventListener(`pointermove`, pointer)
		onCleanup(() => {
			window.removeEventListener(`resize`, resize)
			host!.removeEventListener(`pointermove`, pointer)
		})
	})
	return (
		<bug-rangers3-d
			className={css.class}
			ref={(element) => {
				host = element
			}}
		>
			<canvas.Scene
				camera={gameCamera}
				width={viewport()[0]}
				height={viewport()[1]}
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
