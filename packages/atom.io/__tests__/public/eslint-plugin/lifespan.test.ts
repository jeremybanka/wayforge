import parser from "@typescript-eslint/parser"
import { Rules } from "atom.io/eslint-plugin"
import { RuleTester } from "eslint-v9"

const ruleTester = new RuleTester({ languageOptions: { parser } })
Object.assign(ruleTester, { describe, it })
const rule = Rules.lifespan

ruleTester.run(
	`lifespan: don't import ephemeral tools for an immortal store`,
	rule,
	{
		valid: [
			{
				name: `import from some other package`,
				code: `
        import * as SomeOtherPackage from "some-other-package"
      `,
			},
			{
				name: `import from ephemeral with no option set`,
				code: `
        import * as Ephemeral from "atom.io/ephemeral"
      `,
			},
			{
				name: `import from immortal with no option set`,
				code: `
        import * as Immortal from "atom.io/immortal"
      `,
			},
			{
				name: `import from ephemeral with ephemeral option set`,
				options: [`ephemeral`],
				code: `
        import * as Ephemeral from "atom.io/ephemeral"
      `,
			},
			{
				name: `import from immortal with immortal option set`,
				options: [`immortal`],
				code: `
        import * as Immortal from "atom.io/immortal"
      `,
			},
			{
				name: `import from immortal with ephemeral option set`,
				options: [`ephemeral`],
				code: `
        import * as Immortal from "atom.io/immortal"
      `,
			},
		],
		invalid: [
			{
				name: `import from ephemeral with immortal option set`,
				options: [`immortal`],
				code: `
        import * as Ephemeral from "atom.io/ephemeral"
      `,
				errors: 1,
			},
		],
	},
)

ruleTester.run(`lifespan: don't use the find transactor`, rule, {
	valid: [
		{
			name: `transaction, standard`,
			options: [`ephemeral`],
			code: `
				transaction<(increment: number) => void>({
					key: "increment",
					do: ({ find, set }, increment) => {
						const countState = find(countAtoms, "my-key")
						set(countState, (c) => c + increment)
					}
				})
			`,
		},
	],
	invalid: [
		{
			name: `selector, standard`,
			options: [`immortal`],
			code: `
				const clientNameState = selector<Loadable<string | null>>({
					key: "clientName",
					get: async ({ find, get }) => {
						const query = await fetch("https://api.github.com/users/jeremybanka")
						const json = await query.json()
						const clientState = find(clientAtoms, json.key)
						const client = get(clientState)
						return client?.name
					}
				}) 
			`,
			errors: 1,
		},
		{
			name: `selector, not destructured`,
			options: [`immortal`],
			code: `
				const clientNameState = selector<Loadable<string | null>>({
					key: "clientName",
					get: async (transactors) => {
						const query = await fetch("https://api.github.com/users/jeremybanka")
						const json = await query.json()
						const clientState = transactors.find(clientAtoms, json.key)
						const client = transactors.get(clientState)
						return client?.name
					}
				}) 
			`,
			errors: 1,
		},
		{
			name: `selectorFamily, standard`,
			options: [`immortal`],
			code: `
				const quotientState = selectorFamily<number, string>({
					key: "quotient",
					get: (id) => ({ find, get }) => {
						const a = get(find(dividendAtoms, id))
						const b = get(find(divisorAtoms, id))
						return a / b
					}
				}) 
			`,
			errors: 2,
		},
		{
			name: `selectorFamily, not destructured`,
			options: [`immortal`],
			code: `
				const quotientState = selectorFamily<number, string>({
					key: "quotient",
					get: (id) => (transactors) => {
						const a = transactors.get(transactors.find(dividendAtoms, id))
						const b = transactors.get(transactors.find(divisorAtoms, id))
						return a / b
					}
				}) 
			`,
			errors: 2,
		},
		{
			name: `selectorFamily, intermediate body`,
			options: [`immortal`],
			code: `
				const quotientState = selectorFamily<number, string>({
					key: "quotient",
					get: (id) => {
						return ({ find, get }) => {
							const a = get(find(dividendAtoms, id))
							const b = get(find(divisorAtoms, id))
							return a / b
						}
					}
				}) 
			`,
			errors: 2,
		},
		{
			name: `transaction, standard`,
			options: [`immortal`],
			code: `
				transaction<(increment: number) => void>({
					key: "increment",
					do: ({ find, set }, increment) => {
						const countState = find(countAtoms, "my-key")
						set(countState, (c) => c + increment)
					}
				})
			`,
			errors: 1,
		},
	],
})

ruleTester.run(`lifespan: don't use findState in an immortal store`, rule, {
	valid: [
		{
			name: `use findState global with no option set`,
			code: `
				const doubleState = findState(doubleSelectors, "my-key")
			`,
		},
		{
			name: `use findState global with ephemeral option set`,
			options: [`ephemeral`],
			code: `
				const doubleState = findState(doubleSelectors, "my-key")
			`,
		},
		{
			name: `[edge case]: iife bails early`,
			options: [`immortal`],
			code: `
					(() => {})()
				`,
		},
	],
	invalid: [
		{
			name: `use findState global with immortal option set`,
			options: [`immortal`],
			code: `
				const doubleState = findState(doubleSelectors, "my-key")
			`,
			errors: 1,
		},
		{
			name: `use findState Silo method with immortal option set`,
			options: [`immortal`],
			code: `
				const doubleState = Silo("my-key").findState(doubleSelectors)
			`,
			errors: 1,
		},
	],
})
