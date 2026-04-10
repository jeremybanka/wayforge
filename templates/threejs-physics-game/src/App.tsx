import { atom, getState, selector, setState } from "atom.io"
import { useO } from "atom.io/solid"
import type { JSX } from "solid-js"
import { onCleanup, onMount } from "solid-js"
import * as THREE from "three"

type ControlKey =
	| `ArrowDown`
	| `ArrowLeft`
	| `ArrowRight`
	| `ArrowUp`
	| `KeyA`
	| `KeyD`
	| `KeyS`
	| `KeyW`
	| `ShiftLeft`
	| `Space`

type AxisKey = `ArrowDown` | `ArrowLeft` | `ArrowRight` | `ArrowUp` | `KeyA` | `KeyD` | `KeyS` | `KeyW`

type PlayerPhysics = {
	isGrounded: boolean
	planarVelocity: THREE.Vector2
	position: THREE.Vector3
	velocity: THREE.Vector3
}

const PLAYER_RADIUS = 0.45
const PLAYER_HEIGHT = 1.6
const PLAYER_Y = PLAYER_HEIGHT * 0.5
const GRAVITY = 24
const MOVE_SPEED = 6
const SPRINT_MULTIPLIER = 1.65
const JUMP_STAMINA_MIN = 18
const JUMP_STAMINA_MAX = 28
const JUMP_IMPULSE_PER_STAMINA = 0.21
const JUMP_FORWARD_IMPULSE = 1.35
const TURN_RATE = Math.PI * 4
const STAMINA_MAX = 100
const STAMINA_RECOVERY_PER_SECOND = 20
const CAMERA_DISTANCE = 8.5
const CAMERA_PITCH_MAX = Math.PI * 0.42
const CAMERA_PITCH_MIN = Math.PI * 0.12
const CAMERA_LOOK_OFFSET = new THREE.Vector3(0, 1.1, 0)

const staminaAtom = atom<number>({
	key: `stamina`,
	default: STAMINA_MAX,
})

const isGroundedAtom = atom<boolean>({
	key: `isGrounded`,
	default: true,
})

const jumpReadySelector = selector<boolean>({
	key: `jumpReady`,
	get: ({ get }) => get(isGroundedAtom) && get(staminaAtom) >= JUMP_STAMINA_MIN,
})

function spendJumpStamina(): number {
	const stamina = getState(staminaAtom)
	if (stamina < JUMP_STAMINA_MIN) return 0
	const spent = Math.min(stamina, JUMP_STAMINA_MAX)
	setState(staminaAtom, stamina - spent)
	return spent
}

function recoverStamina(deltaSeconds: number): void {
	setState(staminaAtom, (stamina) =>
		Math.min(STAMINA_MAX, stamina + deltaSeconds * STAMINA_RECOVERY_PER_SECOND),
	)
}

function createArena(scene: THREE.Scene): void {
	const floorGeometry = new THREE.CircleGeometry(24, 64)
	const floorMaterial = new THREE.MeshStandardMaterial({
		color: `#8a9b72`,
		roughness: 0.95,
		metalness: 0.05,
	})
	const floor = new THREE.Mesh(floorGeometry, floorMaterial)
	floor.rotation.x = -Math.PI * 0.5
	floor.receiveShadow = true
	scene.add(floor)

	const ringGeometry = new THREE.TorusGeometry(18, 0.15, 16, 96)
	const ringMaterial = new THREE.MeshStandardMaterial({
		color: `#d8c1a0`,
		emissive: `#24170a`,
		roughness: 0.35,
	})
	const ring = new THREE.Mesh(ringGeometry, ringMaterial)
	ring.rotation.x = Math.PI * 0.5
	ring.position.y = 0.02
	scene.add(ring)

	const boxGeometry = new THREE.BoxGeometry(1.6, 1.6, 1.6)
	for (let index = 0; index < 18; index += 1) {
		const angle = (index / 18) * Math.PI * 2
		const radius = 11 + (index % 2 === 0 ? 0.8 : -0.3)
		const box = new THREE.Mesh(
			boxGeometry,
			new THREE.MeshStandardMaterial({
				color: index % 3 === 0 ? `#bf7b4d` : `#7086a4`,
				roughness: 0.88,
			}),
		)
		box.position.set(Math.cos(angle) * radius, 0.8, Math.sin(angle) * radius)
		box.castShadow = true
		box.receiveShadow = true
		scene.add(box)
	}
}

function applyGroundCollision(player: PlayerPhysics): void {
	if (player.position.y <= PLAYER_Y) {
		player.position.y = PLAYER_Y
		player.velocity.x = 0
		player.velocity.y = 0
		player.velocity.z = 0
		player.isGrounded = true
		return
	}
	player.isGrounded = false
}

export function App(): JSX.Element {
	const stamina = useO(staminaAtom)
	const jumpReady = useO(jumpReadySelector)
	const grounded = useO(isGroundedAtom)

	let host!: HTMLDivElement

	onMount(() => {
		const renderer = new THREE.WebGLRenderer({ antialias: true })
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
		renderer.setSize(host.clientWidth, host.clientHeight)
		renderer.shadowMap.enabled = true
		host.append(renderer.domElement)

		const scene = new THREE.Scene()
		scene.background = new THREE.Color(`#dce7f2`)
		scene.fog = new THREE.Fog(`#dce7f2`, 18, 38)

		const camera = new THREE.PerspectiveCamera(
			65,
			host.clientWidth / host.clientHeight,
			0.1,
			100,
		)

		const hemi = new THREE.HemisphereLight(`#f5f4dc`, `#42556f`, 1.8)
		scene.add(hemi)

		const sun = new THREE.DirectionalLight(`#fff2d6`, 2.4)
		sun.position.set(6, 12, 8)
		sun.castShadow = true
		sun.shadow.mapSize.set(2048, 2048)
		sun.shadow.camera.near = 0.1
		sun.shadow.camera.far = 40
		sun.shadow.camera.left = -16
		sun.shadow.camera.right = 16
		sun.shadow.camera.top = 16
		sun.shadow.camera.bottom = -16
		scene.add(sun)

		createArena(scene)

		const player = new THREE.Mesh(
			new THREE.CylinderGeometry(PLAYER_RADIUS, PLAYER_RADIUS, PLAYER_HEIGHT, 20),
			new THREE.MeshStandardMaterial({
				color: `#1f3d5b`,
				roughness: 0.45,
				metalness: 0.1,
			}),
		)
		player.position.set(0, PLAYER_Y, 0)
		player.castShadow = true
		player.receiveShadow = true
		scene.add(player)

		const shadow = new THREE.Mesh(
			new THREE.CircleGeometry(0.85, 32),
			new THREE.MeshBasicMaterial({
				color: `#112338`,
				opacity: 0.18,
				transparent: true,
			}),
		)
		shadow.rotation.x = -Math.PI * 0.5
		shadow.position.y = 0.02
		scene.add(shadow)

		const keys = new Set<ControlKey>()
		const horizontalInputs: AxisKey[] = []
		const verticalInputs: AxisKey[] = []
		const physics: PlayerPhysics = {
			isGrounded: true,
			planarVelocity: new THREE.Vector2(),
			position: player.position,
			velocity: new THREE.Vector3(),
		}
		const cameraForward = new THREE.Vector3()
		const cameraRight = new THREE.Vector3()
		const moveDirection = new THREE.Vector3()
		const cameraOffset = new THREE.Vector3()
		const cameraTarget = new THREE.Vector3()
		const lookTarget = new THREE.Vector3()
		const clock = new THREE.Clock()
		let cameraYaw = Math.PI
		let cameraPitch = Math.PI * 0.3
		let isOrbiting = false
		let pointerId: number | null = null
		let previousPointerX = 0
		let previousPointerY = 0
		let frameId = 0

		const resize = (): void => {
			const { clientHeight, clientWidth } = host
			camera.aspect = clientWidth / clientHeight
			camera.updateProjectionMatrix()
			renderer.setSize(clientWidth, clientHeight)
		}

		const onKeyDown = (event: KeyboardEvent): void => {
			if (event.code === `Space`) {
				event.preventDefault()
				if (physics.isGrounded) {
					const spent = spendJumpStamina()
					if (spent > 0) {
						physics.velocity.x =
							physics.planarVelocity.x * JUMP_FORWARD_IMPULSE
						physics.velocity.z =
							physics.planarVelocity.y * JUMP_FORWARD_IMPULSE
						physics.velocity.y += spent * JUMP_IMPULSE_PER_STAMINA
						physics.isGrounded = false
					}
				}
			}
			if (isControlKey(event.code)) {
				if (event.repeat === false) {
					pushAxisInput(horizontalInputs, event.code, isHorizontalAxisKey)
					pushAxisInput(verticalInputs, event.code, isVerticalAxisKey)
				}
				keys.add(event.code)
			}
		}

		const onKeyUp = (event: KeyboardEvent): void => {
			if (isControlKey(event.code)) {
				keys.delete(event.code)
				removeAxisInput(horizontalInputs, event.code)
				removeAxisInput(verticalInputs, event.code)
			}
		}

		const onPointerDown = (event: PointerEvent): void => {
			if (event.button !== 2) return
			isOrbiting = true
			pointerId = event.pointerId
			previousPointerX = event.clientX
			previousPointerY = event.clientY
			host.setPointerCapture(event.pointerId)
		}

		const onPointerMove = (event: PointerEvent): void => {
			if (isOrbiting === false || event.pointerId !== pointerId) return
			const deltaX = event.clientX - previousPointerX
			const deltaY = event.clientY - previousPointerY
			previousPointerX = event.clientX
			previousPointerY = event.clientY
			cameraYaw -= deltaX * 0.008
			cameraPitch = THREE.MathUtils.clamp(
				cameraPitch - deltaY * 0.006,
				CAMERA_PITCH_MIN,
				CAMERA_PITCH_MAX,
			)
		}

		const onPointerUp = (event: PointerEvent): void => {
			if (event.pointerId !== pointerId) return
			isOrbiting = false
			pointerId = null
			if (host.hasPointerCapture(event.pointerId)) {
				host.releasePointerCapture(event.pointerId)
			}
		}

		const onContextMenu = (event: MouseEvent): void => {
			event.preventDefault()
		}

		window.addEventListener(`resize`, resize)
		window.addEventListener(`keydown`, onKeyDown)
		window.addEventListener(`keyup`, onKeyUp)
		host.addEventListener(`pointerdown`, onPointerDown)
		host.addEventListener(`pointermove`, onPointerMove)
		host.addEventListener(`pointerup`, onPointerUp)
		host.addEventListener(`pointercancel`, onPointerUp)
		host.addEventListener(`contextmenu`, onContextMenu)

		const frame = (): void => {
			const deltaSeconds = Math.min(clock.getDelta(), 0.033)
			moveDirection.set(0, 0, 0)
			cameraForward.set(
				Math.sin(cameraYaw + Math.PI),
				0,
				Math.cos(cameraYaw + Math.PI),
			)
			cameraRight.set(
				Math.sin(cameraYaw + Math.PI * 0.5),
				0,
				Math.cos(cameraYaw + Math.PI * 0.5),
			)
			moveDirection
				.addScaledVector(cameraRight, resolveAxisDirection(horizontalInputs))
				.addScaledVector(cameraForward, -resolveAxisDirection(verticalInputs))

			const speedMultiplier = keys.has(`ShiftLeft`) ? SPRINT_MULTIPLIER : 1
			if (physics.isGrounded && moveDirection.lengthSq() > 0) {
				moveDirection.normalize()
				const groundedSpeed = MOVE_SPEED * speedMultiplier
				physics.planarVelocity.set(
					moveDirection.x * groundedSpeed,
					moveDirection.z * groundedSpeed,
				)
				physics.position.x += physics.planarVelocity.x * deltaSeconds
				physics.position.z += physics.planarVelocity.y * deltaSeconds
			} else if (physics.isGrounded) {
				physics.planarVelocity.set(0, 0)
			}

			player.rotation.y = turnTowardAngle(
				player.rotation.y,
				normalizeAngle(cameraYaw),
				TURN_RATE * deltaSeconds,
			)

			physics.velocity.y -= GRAVITY * deltaSeconds
			if (physics.isGrounded === false) {
				physics.position.x += physics.velocity.x * deltaSeconds
				physics.position.z += physics.velocity.z * deltaSeconds
			}
			physics.position.y += physics.velocity.y * deltaSeconds
			applyGroundCollision(physics)

			const arenaRadius = 16.75
			const planarDistance = Math.hypot(physics.position.x, physics.position.z)
			if (planarDistance > arenaRadius) {
				const clamp = arenaRadius / planarDistance
				physics.position.x *= clamp
				physics.position.z *= clamp
			}

			recoverStamina(deltaSeconds)
			setState(isGroundedAtom, physics.isGrounded)

			shadow.position.set(player.position.x, 0.02, player.position.z)
			shadow.scale.setScalar(1 - Math.min((player.position.y - PLAYER_Y) / 6, 0.45))

			cameraOffset.setFromSphericalCoords(
				CAMERA_DISTANCE,
				cameraPitch,
				cameraYaw,
			)
			cameraTarget.copy(player.position).add(cameraOffset)
			camera.position.lerp(cameraTarget, 1 - Math.pow(0.0001, deltaSeconds))
			lookTarget.copy(player.position).add(CAMERA_LOOK_OFFSET)
			camera.lookAt(lookTarget)

			renderer.render(scene, camera)
			frameId = requestAnimationFrame(frame)
		}

		resize()
		frame()

		onCleanup(() => {
			cancelAnimationFrame(frameId)
			window.removeEventListener(`resize`, resize)
			window.removeEventListener(`keydown`, onKeyDown)
			window.removeEventListener(`keyup`, onKeyUp)
			host.removeEventListener(`pointerdown`, onPointerDown)
			host.removeEventListener(`pointermove`, onPointerMove)
			host.removeEventListener(`pointerup`, onPointerUp)
			host.removeEventListener(`pointercancel`, onPointerUp)
			host.removeEventListener(`contextmenu`, onContextMenu)
			renderer.dispose()
			scene.traverse((object) => {
				if (!(object instanceof THREE.Mesh)) return
				object.geometry.dispose()
				if (Array.isArray(object.material)) {
					for (const material of object.material) {
						material.dispose()
					}
					return
				}
				object.material.dispose()
			})
			if (host.contains(renderer.domElement)) {
				host.removeChild(renderer.domElement)
			}
		})
	})

	return (
		<main class="shell">
			<div class="hud">
				<div class="panel">
					<p class="eyebrow">threejs-physics-game</p>
					<h1>Cylinder Training Grounds</h1>
					<p class="copy">
						Move with <kbd>WASD</kbd> or arrow keys, sprint with <kbd>Shift</kbd>,
						and jump with <kbd>Space</kbd>.
					</p>
				</div>
				<div class="panel status">
					<div class="meter-row">
						<span>Stamina</span>
						<strong>{stamina().toFixed(0)} / 100</strong>
					</div>
					<div class="meter">
						<div
							class="meter-fill"
							style={{ width: `${stamina()}%` }}
						/>
					</div>
					<p class="copy small">
						Space spends stamina to create jump impulse. {jumpReady() ? `Jump ready.` : `Recharge to at least 18.`}
					</p>
					<p class="copy small">{grounded() ? `Grounded` : `Airborne`}</p>
				</div>
			</div>
			<div
				ref={host}
				class="viewport"
			/>
		</main>
	)
}

function isControlKey(code: string): code is ControlKey {
	return (
		code === `ArrowDown` ||
		code === `ArrowLeft` ||
		code === `ArrowRight` ||
		code === `ArrowUp` ||
		code === `KeyA` ||
		code === `KeyD` ||
		code === `KeyS` ||
		code === `KeyW` ||
		code === `ShiftLeft` ||
		code === `Space`
	)
}

function isHorizontalAxisKey(key: AxisKey): boolean {
	return key === `ArrowLeft` || key === `ArrowRight` || key === `KeyA` || key === `KeyD`
}

function isVerticalAxisKey(key: AxisKey): boolean {
	return key === `ArrowUp` || key === `ArrowDown` || key === `KeyW` || key === `KeyS`
}

function isAxisKey(code: ControlKey): code is AxisKey {
	return code !== `ShiftLeft` && code !== `Space`
}

function pushAxisInput(
	axisInputs: AxisKey[],
	code: ControlKey,
	matchesAxis: (key: AxisKey) => boolean,
): void {
	if (isAxisKey(code) === false) return
	if (matchesAxis(code) === false) return
	removeAxisInput(axisInputs, code)
	axisInputs.push(code)
}

function removeAxisInput(axisInputs: AxisKey[], code: ControlKey): void {
	if (isAxisKey(code) === false) return
	const index = axisInputs.lastIndexOf(code)
	if (index >= 0) {
		axisInputs.splice(index, 1)
	}
}

function resolveAxisDirection(axisInputs: AxisKey[]): number {
	const latest = axisInputs.at(-1)
	if (!latest) return 0
	switch (latest) {
		case `ArrowLeft`:
		case `KeyA`:
		case `ArrowUp`:
		case `KeyW`:
			return -1
		case `ArrowRight`:
		case `KeyD`:
		case `ArrowDown`:
		case `KeyS`:
			return 1
	}
}

function normalizeAngle(angle: number): number {
	return THREE.MathUtils.euclideanModulo(angle + Math.PI, Math.PI * 2) - Math.PI
}

function turnTowardAngle(current: number, target: number, maxDelta: number): number {
	const delta = normalizeAngle(target - current)
	if (Math.abs(delta) <= maxDelta) return target
	return current + Math.sign(delta) * maxDelta
}
