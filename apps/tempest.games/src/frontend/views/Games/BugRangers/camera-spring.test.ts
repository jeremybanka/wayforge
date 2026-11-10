import { createCameraSpring } from "./camera-spring"

test(`camera focus settles and releases the orbit target for manual panning`, () => {
	const spring = createCameraSpring([0, 0, 0])
	expect(spring.advance([0, 0, 0], 1 / 60)).toBeNull()
	let last: number[] = []
	for (let frame = 0; frame < 180; frame++) {
		const value = spring.advance([3, 0, 1], 1 / 60)
		if (value) last = value.toArray()
	}
	expect(last).toEqual([3, 0, 1])
	expect(spring.advance([3, 0, 1], 1 / 60)).toBeNull()
})

test(`camera focus can be retargeted while moving without jumping to the new goal`, () => {
	const spring = createCameraSpring([0, 0, 0])
	for (let frame = 0; frame < 8; frame++) spring.advance([3, 0, 1], 1 / 60)
	const before = spring.advance([3, 0, 1], 1 / 60)!.clone()
	const after = spring.advance([-3, 0, -1], 1 / 60)!.clone()
	expect(before.distanceTo(after)).toBeLessThan(0.5)
	let last = after
	for (let frame = 0; frame < 180; frame++)
		last = spring.advance([-3, 0, -1], 1 / 60)?.clone() ?? last
	expect(last.toArray()).toEqual([-3, 0, -1])
})
