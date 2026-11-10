import { myRoomKeySelector } from "@atom.io/realtime/client"
import type { Children } from "@atom.io/spa"
import { onCleanup, onMount, useGetter, useId, useSetter } from "@atom.io/spa"
import { AmbientLight, DirectionalLight } from "@atom.io/spa/three"
import { atomFamily, disposeState } from "atom.io"
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
import { GameCanvas } from "./GameCanvas"
import { HexGridHelper } from "./HexGridHelper"
import { PlayerTools } from "./PlayerTools"
import { gameCamera, gamePointer } from "./scene-state"
import { GameTiles, PlayableZones } from "./TilesAndZones"

const viewportAtoms = atomFamily<readonly [number, number], string>({
	key: `viewport`,
	default: () => [window.innerWidth, window.innerHeight],
})

export function BugRangers3D(): Children {
	const target = useGetter(cameraTargetAtom)
	const enabled = useGetter(controlsEnabledAtom)
	const spring = createCameraSpring(target())
	const instanceKey = useId()
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
			controls?.dispose()
		})
	})
	return (
		<bug-rangers3-d
			className={css.class}
			ref={(element) => {
				host = element
			}}
		>
			<GameCanvas
				camera={gameCamera}
				width={viewport()[0]}
				height={viewport()[1]}
				onFrame={({ renderer, delta }) => {
					if (!controls) {
						controls = new OrbitControls(gameCamera, renderer.domElement)
						controls.enableDamping = true
						controls.dampingFactor = 0.05
					}
					gameCamera.aspect = viewport()[0] / viewport()[1]
					gameCamera.updateProjectionMatrix()
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
			</GameCanvas>
		</bug-rangers3-d>
	)
}
function BugRangersExterior3D(): Children {
	const room = useGetter(myRoomKeySelector)
	return <>{room() ? <BugRangersInterior3D key={room()!} /> : null}</>
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
