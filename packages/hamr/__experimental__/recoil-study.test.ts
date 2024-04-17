import { atom, selector, snapshot_UNSTABLE } from "recoil"

const myAtom = atom<number>({
	key: `myAtom`,
	default: 37,
})

const mySelector = selector<number>({
	key: `mySelector`,
	get: ({ get }) => get(myAtom) * 2,
})

describe(`mySelector`, () => {
	it(`should return 74`, () => {
		const tree = snapshot_UNSTABLE()
		expect(tree.getLoadable(mySelector).contents).toBe(74)
	})
})
