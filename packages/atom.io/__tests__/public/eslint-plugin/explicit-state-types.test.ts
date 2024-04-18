import { RuleTester } from "@typescript-eslint/rule-tester"
import { Rules } from "atom.io/eslint-plugin"

const ruleTester = new RuleTester({ parser: `@typescript-eslint/parser` })
Object.assign(ruleTester, { describe, it })
const rule = Rules.explicitStateTypes

ruleTester.run(`explicit-state-types`, rule, {
	valid: [
		{
			name: `atom`,
			code: `
      const countState = atom<number>({
        key: "count",
        default: 0,
      })
    `,
		},
		{
			name: `atomFamily`,
			code: `
      const countAtoms = atomFamily<number, string>({
        key: "counts",
        default: 0,
      })
    `,
		},
		{
			name: `selector`,
			code: `
      const doubleState = selector<number>({
        key: "double",
        get: ({ get }) => get(countState),
      })
    `,
		},
		{
			name: `selectorFamily`,
			code: `
      const doubleSelectors = selectorFamily<number, string>({
        key: "doubles",
        default: (id) => ({ find, get }) => get(find(countAtoms, id)),
      })
    `,
		},
		{
			name: `Silo`,
			code: `
        const silo = new Silo("SILO", IMPLICIT.STORE)
        const countState = silo.atom<number>({
          key: "count",
          default: 0,
        })
        const countAtoms = silo.atomFamily<number, string>({
          key: "counts",
          default: 0,
        })
        const doubleState = silo.selector<number>({
          key: "double",
          get: ({ get }) => get(countState),
        })
        const doubleSelectors = silo.selectorFamily<number, string>({
          key: "doubles",
          default: (id) => ({ find, get }) => get(find(countAtoms, id)),
        })
      `,
		},
	],
	invalid: [
		{
			name: `atom`,
			code: `
        const count = atom({
          key: "count",
          default: 0,
        })
      `,
			errors: [{ messageId: `noTypeArgument` }],
		},
		{
			name: `atomFamily`,
			code: `
        const countAtoms = atomFamily({
          key: "counts",
          default: 0,
        })
      `,
			errors: [{ messageId: `noTypeArgument` }],
		},
		{
			name: `selector`,
			code: `
        const doubleState = selector({
          key: "double",
          get: ({ get }) => get(countState),
        })
      `,
			errors: [{ messageId: `noTypeArgument` }],
		},
		{
			name: `selectorFamily`,
			code: `
        const doubleSelectors = selectorFamily({
          key: "doubles",
          default: (id) => ({ find, get }) => get(find(countAtoms, id)),
        })
      `,
			errors: [{ messageId: `noTypeArgument` }],
		},
		{
			name: `Silo`,
			code: `
        const silo = new Silo("SILO", IMPLICIT.STORE)
        const countState = silo.atom({
          key: "count",
          default: 0,
        })
        const countAtoms = silo.atomFamily({
          key: "counts",
          default: 0,
        })
        const doubleState = silo.selector({
          key: "double",
          get: ({ get }) => get(countState),
        })
        const doubleSelectors = silo.selectorFamily({
          key: "doubles",
          default: (id) => ({ find, get }) => get(find(countAtoms, id)),
        })
      `,
			errors: [
				{ messageId: `noTypeArgument` },
				{ messageId: `noTypeArgument` },
				{ messageId: `noTypeArgument` },
				{ messageId: `noTypeArgument` },
			],
		},
	],
})
