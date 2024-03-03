import { atom, atomFamily, getState, setState } from "atom.io"
import { dict } from "atom.io/data"

describe(`dict`, () => {
	it(`creates a selector that maps a list of keys to a dict`, () => {
		type User = {
			name: string
			age: number
			email: string
		}
		const findUserState = atomFamily<User, string>({
			key: `user`,
			default: {
				name: ``,
				age: 0,
				email: ``,
			},
		})
		const userIndex = atom<string[]>({
			key: `userIds`,
			default: [],
		})
		const userDict = dict(findUserState, userIndex)
		setState(userIndex, [`1`, `2`, `3`])
		setState(findUserState(`1`), { name: `Bob`, age: 42, email: `` })
		const users = getState(userDict)
		expect(users).toEqual({
			"1": { name: `Bob`, age: 42, email: `` },
			"2": { name: ``, age: 0, email: `` },
			"3": { name: ``, age: 0, email: `` },
		})
		expect(userDict.key).toEqual(`userDict`)
	})
})
