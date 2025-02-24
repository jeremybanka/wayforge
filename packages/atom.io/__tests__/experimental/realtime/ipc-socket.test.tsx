import { ParentSocket } from "atom.io/realtime-server"

it(`ParentSocket`, () => {
	expect(() => new ParentSocket()).not.toThrow()
})
