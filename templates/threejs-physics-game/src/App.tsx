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

type SlideParticle = {
	age: number
	mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>
	velocity: THREE.Vector3
}

type EnergyOrb = {
	age: number
	mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>
	velocity: THREE.Vector3
}

const PLAYER_RADIUS = 0.45
const PLAYER_HEIGHT = 1.6
const PLAYER_Y = PLAYER_HEIGHT * 0.5
const CROUCH_HEIGHT_SCALE = 0.5
const WORLD_SCALE = 20
const GRAVITY = 24
const MOVE_SPEED = 6
const SPRINT_MULTIPLIER = 2.2
const JUMP_IMPULSE = 5.2
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
const SPRINT_STAMINA_DRAIN_PER_SECOND = 24
const CAMERA_DISTANCE = 8.5
const CAMERA_PITCH_MAX = Math.PI * 0.42
const CAMERA_PITCH_MIN = Math.PI * 0.12
const CAMERA_ORBIT_HEIGHT = PLAYER_HEIGHT * 0.7
const CAMERA_DRAG_SENSITIVITY_X = 0.006
const CAMERA_DRAG_SENSITIVITY_Y = 0.0045
const TARGET_CYLINDER_RADIUS = 20
const TARGET_CYLINDER_HEIGHT = 100
const ENERGY_ORB_SPEED = 18
const ENERGY_ORB_LIFETIME = 10
const SLIDE_PARTICLE_INTERVAL = 0.045
const SLIDE_PARTICLE_LIFETIME = 0.42
const SLIDE_PARTICLE_LIMIT = 40
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

const sprintReadySelector = selector<boolean>({
	key: `sprintReady`,
	get: ({ get }) => get(staminaAtom) > 0,
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

function recoverStamina(deltaSeconds: number): void {
	setState(staminaAtom, (stamina) =>
		Math.min(STAMINA_MAX, stamina + deltaSeconds * STAMINA_RECOVERY_PER_SECOND),
	)
}

function drainSprintStamina(deltaSeconds: number): void {
	setState(staminaAtom, (stamina) =>
		Math.max(0, stamina - deltaSeconds * SPRINT_STAMINA_DRAIN_PER_SECOND),
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
	const sprintReady = useO(sprintReadySelector)
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

		const blaster = new THREE.Mesh(
			createBlasterGeometry(),
			new THREE.MeshStandardMaterial({
				color: `#dce3ea`,
				emissive: `#365d7a`,
				roughness: 0.24,
				metalness: 0.42,
			}),
		)
		blaster.position.set(PLAYER_RADIUS + 0.42, 0.26, 0)
		player.add(blaster)

		const facingIndicator = new THREE.Mesh(
			new THREE.ConeGeometry(0.18, 0.48, 16),
			new THREE.MeshStandardMaterial({
				color: `#f8f4eb`,
				emissive: `#6e5730`,
				roughness: 0.32,
			}),
		)
		facingIndicator.rotation.x = Math.PI * 0.5
		facingIndicator.position.set(0, 0.1, PLAYER_RADIUS + 0.28)
		player.add(facingIndicator)

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

		const targetBackdrop = createTargetBackdrop()
		const targetBackdropWalls = targetBackdrop.children.filter(
			(child) => child.userData.kind === `target-wall`,
		)
		scene.add(targetBackdrop)

		const targetPointMarker = new THREE.Mesh(
			new THREE.SphereGeometry(0.45, 18, 18),
			new THREE.MeshBasicMaterial({
				color: `#ff4d4d`,
				transparent: true,
				opacity: 0.95,
			}),
		)
		scene.add(targetPointMarker)

		const aimRayGeometry = new THREE.BufferGeometry()
		aimRayGeometry.setAttribute(
			`position`,
			new THREE.BufferAttribute(new Float32Array(6), 3),
		)
		const aimRay = new THREE.Line(
			aimRayGeometry,
			new THREE.LineBasicMaterial({
				color: `#7fd6ff`,
				opacity: 0.75,
				transparent: true,
			}),
		)
		scene.add(aimRay)

		const energyOrbGeometry = new THREE.SphereGeometry(0.22, 16, 16)
		const energyOrbs: EnergyOrb[] = []
		const slideParticleGeometry = new THREE.SphereGeometry(0.18, 10, 10)
		const slideParticles: SlideParticle[] = []

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
		const blasterOrigin = new THREE.Vector3()
		const blasterDirection = new THREE.Vector3()
		const targetPoint = new THREE.Vector3()
		const fallbackTarget = new THREE.Vector3()
		const mouseNdc = new THREE.Vector2()
		const mouseHasMoved = { current: false }
		const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
		const groundHit = new THREE.Vector3()
		const raycaster = new THREE.Raycaster()
		const clock = new THREE.Clock()
		let cameraYaw = Math.PI
		let cameraPitch = Math.PI * 0.3
		let isOrbiting = false
		let pointerId: number | null = null
		let previousPointerX = 0
		let previousPointerY = 0
		let frameId = 0
		let slideParticleAccumulator = 0

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
					physics.velocity.y += JUMP_IMPULSE
					physics.isGrounded = false
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
			updateMouseNdc(event, host, mouseNdc)
			if (event.button !== 2) return
			isOrbiting = true
			pointerId = event.pointerId
			previousPointerX = event.clientX
			previousPointerY = event.clientY
			setState(isCrouchingAtom, true)
			host.setPointerCapture(event.pointerId)
		}

		const onPointerMove = (event: PointerEvent): void => {
			updateMouseNdc(event, host, mouseNdc)
			mouseHasMoved.current = true
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

		const onClick = (event: MouseEvent): void => {
			if (event.button !== 0) return
			spawnEnergyOrb(
				scene,
				energyOrbs,
				energyOrbGeometry,
				blasterOrigin,
				blasterDirection,
			)
		}

		window.addEventListener(`resize`, resize)
		window.addEventListener(`keydown`, onKeyDown)
		window.addEventListener(`keyup`, onKeyUp)
		host.addEventListener(`click`, onClick)
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
			targetBackdrop.position.set(player.position.x, 0, player.position.z)

			const forwardIntent = Math.max(0, -resolveAxisDirection(verticalInputs))
			const isSprinting =
				crouchingNow === false &&
				keys.has(`ShiftLeft`) &&
				forwardIntent > 0 &&
				getState(staminaAtom) > 0
			const speedMultiplier =
				isSprinting ? SPRINT_MULTIPLIER : 1
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

			if (isSprinting) {
				drainSprintStamina(deltaSeconds)
			} else {
				recoverStamina(deltaSeconds)
			}
			setState(isGroundedAtom, physics.isGrounded)
			updateBlasterTarget(
				camera,
				raycaster,
				mouseHasMoved.current,
				mouseNdc,
				targetBackdropWalls,
				groundPlane,
				groundHit,
				targetPoint,
				fallbackTarget,
				blaster,
				blasterOrigin,
				blasterDirection,
				aimRay,
				targetPointMarker,
			)
			updateEnergyOrbs(energyOrbs, deltaSeconds)

			shadow.position.set(player.position.x, 0.02, player.position.z)
			shadow.scale.setScalar(
				1 - Math.min((player.position.y - PLAYER_Y) / 6, 0.45),
			)
			updateSlideParticles(slideParticles, deltaSeconds)
			if (getState(isSlidingSelector) && physics.isGrounded) {
				slideParticleAccumulator += deltaSeconds
				while (slideParticleAccumulator >= SLIDE_PARTICLE_INTERVAL) {
					slideParticleAccumulator -= SLIDE_PARTICLE_INTERVAL
					spawnSlideParticle(
						scene,
						slideParticles,
						slideParticleGeometry,
						player.position,
						physics.velocity,
						crouchingNow,
					)
				}
			} else {
				slideParticleAccumulator = 0
			}

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
			host.removeEventListener(`click`, onClick)
			host.removeEventListener(`pointerdown`, onPointerDown)
			host.removeEventListener(`pointermove`, onPointerMove)
			host.removeEventListener(`pointerup`, onPointerUp)
			host.removeEventListener(`pointercancel`, onPointerUp)
			host.removeEventListener(`contextmenu`, onContextMenu)
			energyOrbGeometry.dispose()
			slideParticleGeometry.dispose()
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
						Jumping is free. Sprinting forward spends stamina over time.{` `}
						{sprintReady() ? `Sprint ready.` : `Recharge to sprint again.`}
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

function spawnSlideParticle(
	scene: THREE.Scene,
	slideParticles: SlideParticle[],
	geometry: THREE.SphereGeometry,
	playerPosition: THREE.Vector3,
	playerVelocity: THREE.Vector3,
	isCrouching: boolean,
): void {
	if (slideParticles.length >= SLIDE_PARTICLE_LIMIT) {
		const oldest = slideParticles.shift()
		if (oldest) {
			oldest.mesh.removeFromParent()
			oldest.mesh.material.dispose()
		}
	}
	const material = new THREE.MeshBasicMaterial({
		color: `#ffffff`,
		opacity: 0.88,
		transparent: true,
	})
	const mesh = new THREE.Mesh(geometry, material)
	const angle = Math.random() * Math.PI * 2
	const radius = PLAYER_RADIUS * (0.45 + Math.random() * 0.9)
	mesh.position.set(
		playerPosition.x + Math.cos(angle) * radius,
		getStanceCenterY(isCrouching) * 0.28 + Math.random() * 0.08,
		playerPosition.z + Math.sin(angle) * radius,
	)
	mesh.scale.setScalar(0.7 + Math.random() * 0.9)
	const velocity = new THREE.Vector3(
		playerVelocity.x * 0.08 + (Math.random() - 0.5) * 1.8,
		0.8 + Math.random() * 0.5,
		playerVelocity.z * 0.08 + (Math.random() - 0.5) * 1.8,
	)
	scene.add(mesh)
	slideParticles.push({ age: 0, mesh, velocity })
}

function updateSlideParticles(
	slideParticles: SlideParticle[],
	deltaSeconds: number,
): void {
	for (let index = slideParticles.length - 1; index >= 0; index -= 1) {
		const particle = slideParticles[index]
		particle.age += deltaSeconds
		particle.mesh.position.addScaledVector(particle.velocity, deltaSeconds)
		particle.velocity.y += 1.6 * deltaSeconds
		particle.mesh.scale.multiplyScalar(1 + deltaSeconds * 1.8)
		particle.mesh.material.opacity = Math.max(
			0,
			0.88 * (1 - particle.age / SLIDE_PARTICLE_LIFETIME),
		)
		if (particle.age >= SLIDE_PARTICLE_LIFETIME) {
			particle.mesh.removeFromParent()
			particle.mesh.material.dispose()
			slideParticles.splice(index, 1)
		}
	}
}

function updateMouseNdc(
	event: PointerEvent,
	host: HTMLDivElement,
	mouseNdc: THREE.Vector2,
): void {
	const bounds = host.getBoundingClientRect()
	mouseNdc.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
	mouseNdc.y = -(((event.clientY - bounds.top) / bounds.height) * 2 - 1)
}

function updateBlasterTarget(
	camera: THREE.PerspectiveCamera,
	raycaster: THREE.Raycaster,
	mouseHasMoved: boolean,
	mouseNdc: THREE.Vector2,
	targetBackdropWalls: THREE.Object3D[],
	groundPlane: THREE.Plane,
	groundHit: THREE.Vector3,
	targetPoint: THREE.Vector3,
	fallbackTarget: THREE.Vector3,
	blaster: THREE.Mesh,
	blasterOrigin: THREE.Vector3,
	blasterDirection: THREE.Vector3,
	aimRay: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>,
	targetPointMarker: THREE.Mesh,
): void {
	blaster.getWorldPosition(blasterOrigin)
	if (mouseHasMoved) {
		raycaster.setFromCamera(mouseNdc, camera)
		const cylinderHit = raycaster.intersectObjects(targetBackdropWalls, false)[0]
		const hasGroundHit =
			raycaster.ray.intersectPlane(groundPlane, groundHit) !== null
		const groundDistance = hasGroundHit
			? raycaster.ray.origin.distanceToSquared(groundHit)
			: Number.POSITIVE_INFINITY
		const cylinderDistance = cylinderHit
			? raycaster.ray.origin.distanceToSquared(cylinderHit.point)
			: Number.POSITIVE_INFINITY
		if (cylinderDistance < groundDistance) {
			targetPoint.copy(cylinderHit!.point)
		} else if (hasGroundHit) {
			targetPoint.copy(groundHit)
		}
	} else {
		fallbackTarget.copy(blasterOrigin).add(new THREE.Vector3(0, 0, -12))
		targetPoint.copy(fallbackTarget)
	}
	blaster.lookAt(targetPoint)
	blasterDirection
		.set(0, 0, -1)
		.applyQuaternion(blaster.getWorldQuaternion(new THREE.Quaternion()))
		.normalize()
	updateAimRay(aimRay, blasterOrigin, targetPoint)
	targetPointMarker.position.copy(targetPoint)
}

function updateAimRay(
	aimRay: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>,
	origin: THREE.Vector3,
	target: THREE.Vector3,
): void {
	const positions = aimRay.geometry.getAttribute(
		`position`,
	) as THREE.BufferAttribute
	positions.setXYZ(0, origin.x, origin.y, origin.z)
	positions.setXYZ(1, target.x, target.y, target.z)
	positions.needsUpdate = true
}

function spawnEnergyOrb(
	scene: THREE.Scene,
	energyOrbs: EnergyOrb[],
	geometry: THREE.SphereGeometry,
	origin: THREE.Vector3,
	direction: THREE.Vector3,
): void {
	const material = new THREE.MeshStandardMaterial({
		color: `#9fe8ff`,
		emissive: `#56d6ff`,
		emissiveIntensity: 1.2,
		roughness: 0.16,
		metalness: 0.05,
	})
	const mesh = new THREE.Mesh(geometry, material)
	mesh.position.copy(origin).addScaledVector(direction, -0.5)
	scene.add(mesh)
	energyOrbs.push({
		age: 0,
		mesh,
		velocity: direction.clone().multiplyScalar(-ENERGY_ORB_SPEED),
	})
}

function updateEnergyOrbs(energyOrbs: EnergyOrb[], deltaSeconds: number): void {
	for (let index = energyOrbs.length - 1; index >= 0; index -= 1) {
		const orb = energyOrbs[index]
		orb.age += deltaSeconds
		orb.mesh.position.addScaledVector(orb.velocity, deltaSeconds)
		if (orb.mesh.position.y <= 0 || orb.age >= ENERGY_ORB_LIFETIME) {
			orb.mesh.removeFromParent()
			orb.mesh.material.dispose()
			energyOrbs.splice(index, 1)
		}
	}
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

function createBlasterGeometry(): THREE.BufferGeometry {
	const barrel = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 18)
	barrel.rotateX(-Math.PI * 0.5)
	barrel.translate(0, 0, -0.2)

	const body = new THREE.CylinderGeometry(0.16, 0.2, 0.42, 18)
	body.rotateX(-Math.PI * 0.5)
	body.translate(0, 0, 0.32)

	const muzzle = new THREE.CylinderGeometry(0.14, 0.14, 0.08, 18)
	muzzle.rotateX(-Math.PI * 0.5)
	muzzle.translate(0, 0, -0.66)

	return mergeBufferGeometries([barrel, body, muzzle])
}

function createTargetBackdrop(): THREE.Group {
	const group = new THREE.Group()
	const shellMaterial = new THREE.MeshBasicMaterial({
		color: `#7fd6ff`,
		opacity: 0.12,
		transparent: true,
		side: THREE.DoubleSide,
		depthWrite: false,
	})
	const sideLength = 2 * TARGET_CYLINDER_RADIUS * Math.tan(Math.PI / 8)
	const wallGeometry = new THREE.PlaneGeometry(
		sideLength,
		TARGET_CYLINDER_HEIGHT,
	)
	const apothem = TARGET_CYLINDER_RADIUS * Math.cos(Math.PI / 8)
	for (let index = 0; index < 8; index += 1) {
		const angle = (index / 8) * Math.PI * 2
		const wall = new THREE.Mesh(wallGeometry, shellMaterial)
		wall.position.set(
			Math.cos(angle) * apothem,
			TARGET_CYLINDER_HEIGHT * 0.5,
			Math.sin(angle) * apothem,
		)
		wall.rotation.y = Math.PI * 0.5 - angle
		wall.userData.kind = `target-wall`
		group.add(wall)
	}

	// const footprint = new THREE.Mesh(
	// 	new THREE.RingGeometry(
	// 		TARGET_CYLINDER_RADIUS - 0.9,
	// 		TARGET_CYLINDER_RADIUS,
	// 		96,
	// 	),
	// 	new THREE.MeshBasicMaterial({
	// 		color: `#74d6ff`,
	// 		opacity: 0.42,
	// 		transparent: true,
	// 		side: THREE.DoubleSide,
	// 		depthWrite: false,
	// 	}),
	// )
	// footprint.rotation.x = -Math.PI * 0.5
	// footprint.position.y = 0.03
	// group.add(footprint)

	const centerGuideMaterial = new THREE.LineBasicMaterial({
		color: `#d9fbff`,
		opacity: 0.7,
		transparent: true,
	})
	const xGuide = new THREE.Line(
		new THREE.BufferGeometry().setFromPoints([
			new THREE.Vector3(-TARGET_CYLINDER_RADIUS, 0.04, 0),
			new THREE.Vector3(TARGET_CYLINDER_RADIUS, 0.04, 0),
		]),
		centerGuideMaterial,
	)
	const zGuide = new THREE.Line(
		new THREE.BufferGeometry().setFromPoints([
			new THREE.Vector3(0, 0.04, -TARGET_CYLINDER_RADIUS),
			new THREE.Vector3(0, 0.04, TARGET_CYLINDER_RADIUS),
		]),
		centerGuideMaterial,
	)
	group.add(xGuide, zGuide)

	const guideMaterial = new THREE.LineBasicMaterial({
		color: `#dff8ff`,
		opacity: 0.55,
		transparent: true,
	})
	for (let index = 0; index < 8; index += 1) {
		const angle = (index / 8) * Math.PI * 2
		const x = Math.cos(angle) * TARGET_CYLINDER_RADIUS
		const z = Math.sin(angle) * TARGET_CYLINDER_RADIUS
		const guide = new THREE.Line(
			new THREE.BufferGeometry().setFromPoints([
				new THREE.Vector3(x, 0, z),
				new THREE.Vector3(x, TARGET_CYLINDER_HEIGHT, z),
			]),
			guideMaterial,
		)
		group.add(guide)
	}

	return group
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
			mesh.scale.set(
				scale,
				THREE.MathUtils.lerp(0.75, 1.8, Math.random()),
				scale,
			)
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

function mergeBufferGeometries(
	geometries: THREE.BufferGeometry[],
): THREE.BufferGeometry {
	const mergedPositions: number[] = []
	const mergedNormals: number[] = []
	const mergedUvs: number[] = []
	const mergedIndices: number[] = []
	let vertexOffset = 0

	for (const geometry of geometries) {
		const position = geometry.getAttribute(`position`)
		const normal = geometry.getAttribute(`normal`)
		const uv = geometry.getAttribute(`uv`)
		const index = geometry.getIndex()

		mergedPositions.push(...position.array)
		mergedNormals.push(...normal.array)
		mergedUvs.push(...uv.array)

		if (index) {
			for (let cursor = 0; cursor < index.count; cursor += 1) {
				mergedIndices.push(index.array[cursor] + vertexOffset)
			}
		} else {
			for (let cursor = 0; cursor < position.count; cursor += 1) {
				mergedIndices.push(cursor + vertexOffset)
			}
		}
		vertexOffset += position.count
	}

	const merged = new THREE.BufferGeometry()
	merged.setAttribute(
		`position`,
		new THREE.Float32BufferAttribute(mergedPositions, 3),
	)
	merged.setAttribute(
		`normal`,
		new THREE.Float32BufferAttribute(mergedNormals, 3),
	)
	merged.setAttribute(`uv`, new THREE.Float32BufferAttribute(mergedUvs, 2))
	merged.setIndex(mergedIndices)
	return merged
}

function makeRingPoints(y: number): THREE.Vector3[] {
	const points: THREE.Vector3[] = []
	for (let index = 0; index < 64; index += 1) {
		const angle = (index / 64) * Math.PI * 2
		points.push(
			new THREE.Vector3(
				Math.cos(angle) * TARGET_CYLINDER_RADIUS,
				y,
				Math.sin(angle) * TARGET_CYLINDER_RADIUS,
			),
		)
	}
	return points
}

function getStanceCenterY(isCrouching: boolean): number {
	return isCrouching ? PLAYER_Y * CROUCH_HEIGHT_SCALE : PLAYER_Y
}
