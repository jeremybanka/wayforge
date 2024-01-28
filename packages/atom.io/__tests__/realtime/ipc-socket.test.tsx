import { ParentSocket } from "../../realtime-server/src/ipc-socket"

it(`ParentSocket`, () => {
	expect(new ParentSocket()).toThrow
})
