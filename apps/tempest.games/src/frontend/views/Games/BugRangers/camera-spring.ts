import { Vector3 } from "three"

/** Match react-spring's mass 1, tension 170, friction 26 and millisecond steps. */
export function createCameraSpring(initial: readonly number[]): {
	advance: (target: readonly number[], delta: number) => Vector3 | null
} {
	const position = [...initial]
	const velocity = [0, 0, 0]
	const goal = [...initial]
	const precision = [0.005, 0.005, 0.005]
	let active = false
	const result = new Vector3(...initial)
	return {
		advance(target, delta) {
			for (let i = 0; i < 3; i++) {
				if (target[i] !== goal[i]) {
					precision[i] = Math.max(
						Number.EPSILON,
						Math.min(1, Math.abs(target[i] - position[i]) * 0.001),
					)
					goal[i] = target[i]
					active = true
				}
			}
			if (!active) return null
			active = false
			for (let i = 0; i < 3; i++) {
				for (
					let step = 0;
					step < Math.ceil(Math.min(delta * 1000, 64) - 1e-9);
					step++
				) {
					if (
						Math.abs(velocity[i]) <= precision[i] / 10 &&
						Math.abs(goal[i] - position[i]) <= precision[i]
					) {
						position[i] = goal[i]
						velocity[i] = 0
						break
					}
					velocity[i] += -170e-6 * (position[i] - goal[i]) - 26e-3 * velocity[i]
					position[i] += velocity[i]
				}
				if (position[i] !== goal[i] || velocity[i] !== 0) active = true
			}
			return result.set(position[0], position[1], position[2])
		},
	}
}
