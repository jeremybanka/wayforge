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

type AxisKey =
	| `ArrowDown`
	| `ArrowLeft`
	| `ArrowRight`
	| `ArrowUp`
	| `KeyA`
	| `KeyD`
	| `KeyS`
	| `KeyW`

type PlayerPhysics = {
	isGrounded: boolean
	position: THREE.Vector3
	velocity: THREE.Vector3
}

const PLAYER_RADIUS = 0.45
const PLAYER_HEIGHT = 1.6
const PLAYER_Y = PLAYER_HEIGHT * 0.5
const CROUCH_HEIGHT_SCALE = 0.5
const WORLD_SCALE = 20
const GRAVITY = 24
const MOVE_SPEED = 6
const SPRINT_MULTIPLIER = 1.65
const JUMP_STAMINA_MIN = 18
const JUMP_STAMINA_MAX = 28
const JUMP_IMPULSE_PER_STAMINA = 0.21
const JUMP_FORWARD_IMPULSE = 1.35
const TURN_RATE = Math.PI * 4
const WEIGHT_MIN = 50
const WEIGHT_MAX = 150
const WEIGHT_DEFAULT = 85
const CONTROL_GAIN = 12
const BASE_MOTOR_FORCE = 1650
const CROUCH_SPEED_MULTIPLIER = 0.6
const CROUCH_DRIVE_MULTIPLIER = 0.25
const GROUND_FRICTION_MIN = 0
const GROUND_FRICTION_MAX = 100
const GROUND_FRICTION_DEFAULT = 12
const AIR_FRICTION_MIN = 0
const AIR_FRICTION_MAX = 6
const AIR_FRICTION_DEFAULT = 1.1
const SLIDE_FRICTION_MIN = 0
const SLIDE_FRICTION_MAX = 12
const SLIDE_FRICTION_DEFAULT = 1.4
const STAMINA_MAX = 100
const STAMINA_RECOVERY_PER_SECOND = 20
const CAMERA_DISTANCE = 8.5
const CAMERA_PITCH_MAX = Math.PI * 0.42
const CAMERA_PITCH_MIN = Math.PI * 0.12
const CAMERA_ORBIT_HEIGHT = PLAYER_HEIGHT * 0.7
const CAMERA_DRAG_SENSITIVITY_X = 0.006
const CAMERA_DRAG_SENSITIVITY_Y = 0.0045
const PLANAR_DELTA_VELOCITY = new THREE.Vector2()
const PLANAR_ACCELERATION = new THREE.Vector2()

const staminaAtom = atom<number>({
	key: `stamina`,
	default: STAMINA_MAX,
})

const isGroundedAtom = atom<boolean>({
	key: `isGrounded`,
	default: true,
})

const weightAtom = atom<number>({
	key: `weight`,
	default: WEIGHT_DEFAULT,
})

const isCrouchingAtom = atom<boolean>({
	key: `isCrouching`,
	default: false,
})

const planarSpeedAtom = atom<number>({
	key: `planarSpeed`,
	default: 0,
})

const groundFrictionAtom = atom<number>({
	key: `groundFriction`,
	default: GROUND_FRICTION_DEFAULT,
})

const airFrictionAtom = atom<number>({
	key: `airFriction`,
	default: AIR_FRICTION_DEFAULT,
})

const slideFrictionAtom = atom<number>({
	key: `slideFriction`,
	default: SLIDE_FRICTION_DEFAULT,
})

const jumpReadySelector = selector<boolean>({
	key: `jumpReady`,
	get: ({ get }) => get(isGroundedAtom) && get(staminaAtom) >= JUMP_STAMINA_MIN,
})

const baseCrouchSpeedSelector = selector<number>({
	key: `baseCrouchSpeed`,
	get: () => {
		const crouchWalkSpeed = MOVE_SPEED * CROUCH_SPEED_MULTIPLIER
		const crouchSprintSpeed =
			MOVE_SPEED * SPRINT_MULTIPLIER * CROUCH_SPEED_MULTIPLIER
		return (crouchWalkSpeed + crouchSprintSpeed) * 0.5
	},
})

const isSlidingSelector = selector<boolean>({
	key: `isSliding`,
	get: ({ get }) => {
		if (get(isCrouchingAtom) === false) return false
		return get(planarSpeedAtom) > get(baseCrouchSpeedSelector)
	},
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
	const groundTexture = createGroundTexture()
	const floorGeometry = new THREE.CircleGeometry(24 * WORLD_SCALE, 128)
	const floorMaterial = new THREE.MeshStandardMaterial({
		color: `#8a9b72`,
		map: groundTexture,
		roughness: 0.95,
		metalness: 0.05,
	})
	const floor = new THREE.Mesh(floorGeometry, floorMaterial)
	floor.rotation.x = -Math.PI * 0.5
	floor.receiveShadow = true
	scene.add(floor)

	const ringGeometry = new THREE.TorusGeometry(
		18 * WORLD_SCALE,
		0.15 * WORLD_SCALE,
		16,
		192,
	)
	const ringMaterial = new THREE.MeshStandardMaterial({
		color: `#d8c1a0`,
		emissive: `#24170a`,
		roughness: 0.35,
	})
	const ring = new THREE.Mesh(ringGeometry, ringMaterial)
	ring.rotation.x = Math.PI * 0.5
	ring.position.y = 0.02
	scene.add(ring)

	populateArena(scene)
}

function applyGroundCollision(
	player: PlayerPhysics,
	stanceCenterY: number,
): void {
	if (player.position.y <= stanceCenterY) {
		player.position.y = stanceCenterY
		player.velocity.y = 0
		player.isGrounded = true
		return
	}
	player.isGrounded = false
}

export function App(): JSX.Element {
	const stamina = useO(staminaAtom)
	const jumpReady = useO(jumpReadySelector)
	const grounded = useO(isGroundedAtom)
	const weight = useO(weightAtom)
	const isCrouching = useO(isCrouchingAtom)
	const baseCrouchSpeed = useO(baseCrouchSpeedSelector)
	const isSliding = useO(isSlidingSelector)
	const groundFriction = useO(groundFrictionAtom)
	const airFriction = useO(airFrictionAtom)
	const slideFriction = useO(slideFrictionAtom)

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
			new THREE.CylinderGeometry(
				PLAYER_RADIUS,
				PLAYER_RADIUS,
				PLAYER_HEIGHT,
				20,
			),
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
			position: player.position,
			velocity: new THREE.Vector3(),
		}
		const cameraForward = new THREE.Vector3()
		const cameraRight = new THREE.Vector3()
		const moveDirection = new THREE.Vector3()
		const currentPlanarVelocity = new THREE.Vector2()
		const targetPlanarVelocity = new THREE.Vector2()
		const cameraOffset = new THREE.Vector3()
		const cameraAnchor = new THREE.Vector3()
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
						physics.velocity.x *= JUMP_FORWARD_IMPULSE
						physics.velocity.z *= JUMP_FORWARD_IMPULSE
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
			setState(isCrouchingAtom, true)
			host.setPointerCapture(event.pointerId)
		}

		const onPointerMove = (event: PointerEvent): void => {
			if (isOrbiting === false || event.pointerId !== pointerId) return
			const deltaX = event.clientX - previousPointerX
			const deltaY = event.clientY - previousPointerY
			previousPointerX = event.clientX
			previousPointerY = event.clientY
			cameraYaw -= deltaX * CAMERA_DRAG_SENSITIVITY_X
			cameraPitch = THREE.MathUtils.clamp(
				cameraPitch - deltaY * CAMERA_DRAG_SENSITIVITY_Y,
				CAMERA_PITCH_MIN,
				CAMERA_PITCH_MAX,
			)
		}

		const onPointerUp = (event: PointerEvent): void => {
			if (event.pointerId !== pointerId) return
			isOrbiting = false
			pointerId = null
			setState(isCrouchingAtom, false)
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
			const crouchingNow = getState(isCrouchingAtom)
			const stanceCenterY = getStanceCenterY(crouchingNow)
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
			player.scale.y = crouchingNow ? CROUCH_HEIGHT_SCALE : 1
			if (physics.isGrounded) {
				player.position.y = stanceCenterY
			}

			const speedMultiplier =
				crouchingNow || keys.has(`ShiftLeft`) === false ? 1 : SPRINT_MULTIPLIER
			setState(
				planarSpeedAtom,
				Math.hypot(physics.velocity.x, physics.velocity.z),
			)
			if (physics.isGrounded) {
				const groundedSpeed =
					MOVE_SPEED *
					speedMultiplier *
					(crouchingNow ? CROUCH_SPEED_MULTIPLIER : 1)
				currentPlanarVelocity.set(physics.velocity.x, physics.velocity.z)
				targetPlanarVelocity.set(0, 0)
				if (moveDirection.lengthSq() > 0) {
					moveDirection.normalize()
					targetPlanarVelocity.set(
						moveDirection.x * groundedSpeed,
						moveDirection.z * groundedSpeed,
					)
				}
				const effectiveGroundFriction = getState(isSlidingSelector)
					? getState(slideFrictionAtom)
					: getState(groundFrictionAtom)
				easePlanarVelocityPhysics(
					currentPlanarVelocity,
					targetPlanarVelocity,
					getState(weightAtom),
					effectiveGroundFriction,
					crouchingNow ? CROUCH_DRIVE_MULTIPLIER : 1,
					deltaSeconds,
				)
				physics.velocity.x = currentPlanarVelocity.x
				physics.velocity.z = currentPlanarVelocity.y
			} else {
				applyAirDragPhysics(
					physics.velocity,
					getState(weightAtom),
					getState(airFrictionAtom),
					deltaSeconds,
				)
			}

			player.rotation.y = turnTowardAngle(
				player.rotation.y,
				normalizeAngle(cameraYaw),
				TURN_RATE * deltaSeconds,
			)

			physics.velocity.y -= GRAVITY * deltaSeconds
			physics.position.x += physics.velocity.x * deltaSeconds
			physics.position.z += physics.velocity.z * deltaSeconds
			physics.position.y += physics.velocity.y * deltaSeconds
			applyGroundCollision(physics, stanceCenterY)

			const arenaRadius = 16.75 * WORLD_SCALE
			const planarDistance = Math.hypot(physics.position.x, physics.position.z)
			if (planarDistance > arenaRadius) {
				const clamp = arenaRadius / planarDistance
				physics.position.x *= clamp
				physics.position.z *= clamp
			}

			recoverStamina(deltaSeconds)
			setState(isGroundedAtom, physics.isGrounded)

			shadow.position.set(player.position.x, 0.02, player.position.z)
			shadow.scale.setScalar(
				1 - Math.min((player.position.y - PLAYER_Y) / 6, 0.45),
			)

			cameraOffset.setFromSphericalCoords(
				CAMERA_DISTANCE,
				cameraPitch,
				cameraYaw,
			)
			cameraAnchor.set(player.position.x, CAMERA_ORBIT_HEIGHT, player.position.z)
			cameraTarget.copy(cameraAnchor).add(cameraOffset)
			camera.position.lerp(cameraTarget, 1 - Math.pow(0.0001, deltaSeconds))
			lookTarget.copy(cameraAnchor)
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
						Move with <kbd>WASD</kbd> or arrow keys, sprint with <kbd>Shift</kbd>
						, jump with <kbd>Space</kbd>, and hold right mouse to orbit while
						crouching.
					</p>
				</div>
				<div class="panel status">
					<div class="meter-row">
						<span>Stamina</span>
						<strong>{stamina().toFixed(0)} / 100</strong>
					</div>
					<div class="meter">
						<div class="meter-fill" style={{ width: `${stamina()}%` }} />
					</div>
					<p class="copy small">
						Space spends stamina to create jump impulse.{` `}
						{jumpReady() ? `Jump ready.` : `Recharge to at least 18.`}
					</p>
					<p class="copy small">{grounded() ? `Grounded` : `Airborne`}</p>
					<p class="copy small">
						{isCrouching()
							? isSliding()
								? `Sliding`
								: `Crouching`
							: `Standing`}
					</p>
				</div>
				<div class="panel status">
					<div class="meter-row">
						<span>Weight</span>
						<strong>{weight().toFixed(0)} kg</strong>
					</div>
					<input
						type="range"
						min={WEIGHT_MIN}
						max={WEIGHT_MAX}
						step="1"
						value={weight()}
						onInput={(event) => {
							const nextWeight = Number(event.currentTarget.value)
							setState(weightAtom, nextWeight)
						}}
					/>
					<p class="copy small">
						Weight is treated as mass. Heavier characters need more force to
						change velocity, so starts, stops, and reversals all feel slower.
					</p>
				</div>
				<div class="panel status">
					<div class="meter-row">
						<span>Crouch Base Speed</span>
						<strong>{baseCrouchSpeed().toFixed(2)}</strong>
					</div>
					<p class="copy small">
						Sliding begins when crouching speed exceeds this selector-fed
						baseline.
					</p>
				</div>
				<div class="panel status">
					<div class="meter-row">
						<span>Ground Friction</span>
						<strong>{groundFriction().toFixed(1)}</strong>
					</div>
					<input
						type="range"
						min={GROUND_FRICTION_MIN}
						max={GROUND_FRICTION_MAX}
						step="0.1"
						value={groundFriction()}
						onInput={(event) => {
							const nextFriction = Number(event.currentTarget.value)
							setState(groundFrictionAtom, nextFriction)
						}}
					/>
					<p class="copy small">
						Ground friction controls traction. Low friction limits how much
						horizontal acceleration or braking force can reach the ground, so you
						slide.
					</p>
				</div>
				<div class="panel status">
					<div class="meter-row">
						<span>Air Friction</span>
						<strong>{airFriction().toFixed(1)}</strong>
					</div>
					<input
						type="range"
						min={AIR_FRICTION_MIN}
						max={AIR_FRICTION_MAX}
						step="0.1"
						value={airFriction()}
						onInput={(event) => {
							const nextFriction = Number(event.currentTarget.value)
							setState(airFrictionAtom, nextFriction)
						}}
					/>
					<p class="copy small">
						Air friction behaves like drag on horizontal velocity while airborne,
						gradually bleeding off jump carry.
					</p>
				</div>
				<div class="panel status">
					<div class="meter-row">
						<span>Slide Friction</span>
						<strong>{slideFriction().toFixed(1)}</strong>
					</div>
					<input
						type="range"
						min={SLIDE_FRICTION_MIN}
						max={SLIDE_FRICTION_MAX}
						step="0.1"
						value={slideFriction()}
						onInput={(event) => {
							const nextFriction = Number(event.currentTarget.value)
							setState(slideFrictionAtom, nextFriction)
						}}
					/>
					<p class="copy small">
						When crouching above the slide threshold, this lower friction takes
						over and lets momentum carry.
					</p>
				</div>
			</div>
			<div ref={host} class="viewport" />
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
	return (
		key === `ArrowLeft` ||
		key === `ArrowRight` ||
		key === `KeyA` ||
		key === `KeyD`
	)
}

function isVerticalAxisKey(key: AxisKey): boolean {
	return (
		key === `ArrowUp` || key === `ArrowDown` || key === `KeyW` || key === `KeyS`
	)
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

function turnTowardAngle(
	current: number,
	target: number,
	maxDelta: number,
): number {
	const delta = normalizeAngle(target - current)
	if (Math.abs(delta) <= maxDelta) return target
	return current + Math.sign(delta) * maxDelta
}

function easePlanarVelocityPhysics(
	currentVelocity: THREE.Vector2,
	targetVelocity: THREE.Vector2,
	weight: number,
	friction: number,
	driveMultiplier: number,
	deltaSeconds: number,
): void {
	const mass = weight
	PLANAR_DELTA_VELOCITY.copy(targetVelocity).sub(currentVelocity)
	PLANAR_ACCELERATION.copy(PLANAR_DELTA_VELOCITY).multiplyScalar(CONTROL_GAIN)
	const motorAccelerationCap = (BASE_MOTOR_FORCE * driveMultiplier) / mass
	const tractionAccelerationCap =
		getGroundTractionCoefficient(friction) * GRAVITY
	const maxPlanarAcceleration = Math.min(
		motorAccelerationCap,
		tractionAccelerationCap,
	)
	if (
		PLANAR_ACCELERATION.lengthSq() >
		maxPlanarAcceleration * maxPlanarAcceleration
	) {
		PLANAR_ACCELERATION.setLength(maxPlanarAcceleration)
	}
	currentVelocity.addScaledVector(PLANAR_ACCELERATION, deltaSeconds)
	if (currentVelocity.lengthSq() < 0.0001) {
		currentVelocity.set(0, 0)
	}
}

function applyAirDragPhysics(
	velocity: THREE.Vector3,
	weight: number,
	friction: number,
	deltaSeconds: number,
): void {
	if (friction <= 0) return
	const mass = weight
	const dragAccelerationScale = friction / mass
	velocity.x -= velocity.x * dragAccelerationScale * deltaSeconds
	velocity.z -= velocity.z * dragAccelerationScale * deltaSeconds
	if (velocity.x * velocity.x + velocity.z * velocity.z < 0.0001) {
		velocity.x = 0
		velocity.z = 0
	}
}

function getGroundTractionCoefficient(friction: number): number {
	return THREE.MathUtils.lerp(0.08, 1.8, friction / GROUND_FRICTION_MAX)
}

function createGroundTexture(): THREE.CanvasTexture {
	const canvas = document.createElement(`canvas`)
	canvas.width = 512
	canvas.height = 512
	const context = canvas.getContext(`2d`)
	if (!context) throw new Error(`Could not create ground texture context`)

	context.fillStyle = `#8a9b72`
	context.fillRect(0, 0, canvas.width, canvas.height)

	context.fillStyle = `rgba(234, 240, 214, 0.85)`
	for (let y = 24; y < canvas.height; y += 32) {
		for (let x = 24; x < canvas.width; x += 32) {
			context.beginPath()
			context.arc(x, y, 3.5, 0, Math.PI * 2)
			context.fill()
		}
	}

	context.fillStyle = `rgba(67, 87, 58, 0.2)`
	for (let y = 8; y < canvas.height; y += 64) {
		context.fillRect(0, y, canvas.width, 1)
	}
	for (let x = 8; x < canvas.width; x += 64) {
		context.fillRect(x, 0, 1, canvas.height)
	}

	const texture = new THREE.CanvasTexture(canvas)
	texture.colorSpace = THREE.SRGBColorSpace
	texture.wrapS = THREE.RepeatWrapping
	texture.wrapT = THREE.RepeatWrapping
	texture.repeat.set(WORLD_SCALE * 3, WORLD_SCALE * 3)
	texture.anisotropy = 8
	return texture
}

function populateArena(scene: THREE.Scene): void {
	const totalProps = 96
	const innerRadius = 24
	const outerRadius = 15.5 * WORLD_SCALE
	const boxGeometry = new THREE.BoxGeometry(5, 5, 5)
	const columnGeometry = new THREE.CylinderGeometry(2.2, 2.8, 18, 12)
	const slabGeometry = new THREE.BoxGeometry(10, 2.6, 4)
	const colors = [`#bf7b4d`, `#7086a4`, `#d0c4a3`, `#5f7d68`]

	for (let index = 0; index < totalProps; index += 1) {
		const angle = Math.random() * Math.PI * 2
		const radius = THREE.MathUtils.lerp(innerRadius, outerRadius, Math.random())
		const x = Math.cos(angle) * radius
		const z = Math.sin(angle) * radius
		const color = colors[index % colors.length]
		const material = new THREE.MeshStandardMaterial({
			color,
			roughness: 0.88,
		})
		const shape = index % 3
		const mesh =
			shape === 0
				? new THREE.Mesh(boxGeometry, material)
				: shape === 1
					? new THREE.Mesh(columnGeometry, material)
					: new THREE.Mesh(slabGeometry, material)
		if (shape === 0) {
			mesh.scale.setScalar(THREE.MathUtils.lerp(0.8, 1.8, Math.random()))
			mesh.position.y = (5 * mesh.scale.y) / 2
		} else if (shape === 1) {
			const scale = THREE.MathUtils.lerp(0.7, 1.5, Math.random())
			mesh.scale.set(scale, THREE.MathUtils.lerp(0.75, 1.8, Math.random()), scale)
			mesh.position.y = (18 * mesh.scale.y) / 2
		} else {
			mesh.scale.set(
				THREE.MathUtils.lerp(0.9, 1.9, Math.random()),
				THREE.MathUtils.lerp(0.8, 1.6, Math.random()),
				THREE.MathUtils.lerp(0.8, 1.6, Math.random()),
			)
			mesh.position.y = (2.6 * mesh.scale.y) / 2
			mesh.rotation.y = Math.random() * Math.PI
		}
		mesh.position.x = x
		mesh.position.z = z
		mesh.castShadow = true
		mesh.receiveShadow = true
		scene.add(mesh)
	}
}

function getStanceCenterY(isCrouching: boolean): number {
	return isCrouching ? PLAYER_Y * CROUCH_HEIGHT_SCALE : PLAYER_Y
}
