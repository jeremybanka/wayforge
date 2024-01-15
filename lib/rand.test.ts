import { it } from "vitest"

function LCG(seed) {
	// LCG parameters
	const a = 1664525
	const c = 1013904223
	const m = 2 ** 32

	// Current state of the generator
	let state = seed

	// The generator function
	this.next = (): number => {
		state = (a * state + c) % m
		return state / m
	}
}

it(`should generate random numbers`, () => {
	// Usage
	const seed = 123456789 // Your seed
	const rng = new LCG(seed)
	const randomNumbers = Array.from({ length: 10 }, () => rng.next())
	console.log(randomNumbers)
})
