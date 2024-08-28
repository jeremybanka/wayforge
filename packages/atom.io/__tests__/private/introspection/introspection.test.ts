import { IMPLICIT } from "atom.io/internal"
import { attachIntrospectionStates } from "atom.io/introspection"

test(`attachIntrospectionStates`, () => {
	expect(attachIntrospectionStates(IMPLICIT.STORE)).not.toThrow
})
