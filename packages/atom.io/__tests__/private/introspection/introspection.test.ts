import { attachIntrospectionStates } from "atom.io/introspection"

test(`attachIntrospectionStates`, () => {
	expect(attachIntrospectionStates()).not.toThrow
})
