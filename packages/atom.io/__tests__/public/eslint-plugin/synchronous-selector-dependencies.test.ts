import parser from "@typescript-eslint/parser"
import { Rules } from "atom.io/eslint-plugin"
import { RuleTester } from "eslint"

const ruleTester = new RuleTester({ languageOptions: { parser } })
Object.assign(ruleTester, { describe, it })
const rule = Rules.synchronousSelectorDependencies

ruleTester.run(`synchronous-selector-dependencies (selector)`, rule, {
	valid: [
		{
			name: `arrow function without body as getter`,
			code: `
        const doubleState = selector({
          key: "double",
          get: (transactors) => transactors.get(countState) * 2,
        })
      `,
		},
		{
			name: `arrow function with body as getter`,
			code: `
        const doubleState = selector({
          key: "double",
          get: (transactors) => {
            const { get } = transactors
            const count = get(countState)
            return count * 2
          },
        })
      `,
		},
		{
			name: `classic function expression as getter`,
			code: `
        const doubleState = selector({
          key: "double",
          get: function ({ get }) {
            return get(countState) * 2
          },
        })
      `,
		},
		{
			name: `async arrow function expression without body as getter`,
			code: `
        const clientNameState = selector<Loadable<string | null>>({
          key: "clientName",
          get: async ({ get }) => pipe(
            get(clientQueryState),
            (query) => until(query, null),
            async (query) => await (query?.json() ?? query),
            (json) => json.name,
          )
        })
      `,
		},
		{
			name: `async arrow function expression with body as getter`,
			code: `
        const clientNameState = selector<Loadable<string | null>>({
          key: "clientName",
          get: async ({ get }) => {
            const query = get(clientQueryState)
            const json = await query.json()
            return json.name
          }
        })
      `,
		},
		{
			name: `async classic function expression as getter`,
			code: `
        const clientNameState = selector<Loadable<string | null>>({
          key: "clientName",
          get: async function ({ get }) {
            const query = get(clientQueryState)
            const json = await query.json()
            return json.name
          }
        })
      `,
		},
	],
	invalid: [
		{
			name: `straightforward violation`,
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
			name: `straightforward violation (non-destructured)`,
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
			name: `"if" conditional await-get in arrow function with body`,
			code: `
        selector({
          get: async ({ get }) => {
            const response = await fetch("https://api.github.com/users/jeremybanka")
            const json = await response.json()
            if ("key" in json) {
              return get(myRecordState)[json.key]
            } else {
              return null
            }
          },
        })
      `,
			errors: 1,
		},
		{
			name: `"switch" conditional await-get in classic function expression`,
			code: `
        selector({
          get: async ({ get }) => {
            const response = await fetch("https://api.github.com/users/jeremybanka")
            const json = await response.json()
            switch (json.type) {
              case "user":
                return get(myRecordState)[json.key]
              default:
                return null
            }
          },
        })
      `,
			errors: 1,
		},
	],
})
ruleTester.run(`synchronous-selector-dependencies (selectorFamily)`, rule, {
	valid: [
		{
			name: `arrow function without body as getter`,
			code: `
        const doubleState = selectorFamily({
          key: "double",
          get: () => (transactors) => transactors.get(countState) * 2,
        })
      `,
		},
		{
			name: `arrow function with body as getter`,
			code: `
        const doubleState = selectorFamily({
          key: "double",
          get: () => {
            return (transactors) => {
              const { get } = transactors
              const count = get(countState)
              return count * 2
            }
          },
        })
      `,
		},
		{
			name: `classic function expression as getter`,
			code: `
        const doubleState = selectorFamily({
          key: "double",
          get: function () {
            return function ({ get }) {
              return get(countState) * 2
            }
          },
        })
      `,
		},
		{
			name: `async arrow function expression without body as getter`,
			code: `
        const clientNameState = selectorFamily<Loadable<string | null>>({
          key: "clientName",
          get: () => async ({ get }) => pipe(
            get(clientQueryState),
            (query) => until(query, null),
            async (query) => await (query?.json() ?? query),
            (json) => json.name,
          )
        })
      `,
		},
		{
			name: `async arrow function expression with body as getter`,
			code: `
        const clientNameState = selectorFamily<Loadable<string | null>>({
          key: "clientName",
          get: () => async ({ get }) => {
            const query = get(clientQueryState)
            const json = await query.json()
            return json.name
          }
        })
      `,
		},
		{
			name: `async classic function expression as getter`,
			code: `
        const clientNameState = selectorFamily<Loadable<string | null>>({
          key: "clientName",
          get: function () { 
            return async function ({ get }) {
              const query = get(clientQueryState)
              const json = await query.json()
              return json.name
            }
          }
        })
      `,
		},
	],
	invalid: [
		{
			name: `straightforward violation`,
			code: `
        const clientNameState = selectorFamily<Loadable<string | null>>({
          key: "clientName",
          get: () => async ({ find, get }) => {
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
			name: `straightforward violation (non-destructured)`,
			code: `
        const clientNameState = selectorFamily<Loadable<string | null>>({
          key: "clientName",
          get: () => async (transactors) => {
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
			name: `"if" conditional await-get in arrow function with body`,
			code: `
        selectorFamily({
          get: () => async ({ get }) => {
            const response = await fetch("https://api.github.com/users/jeremybanka")
            const json = await response.json()
            if ("key" in json) {
              return get(myRecordState)[json.key]
            } else {
              return null
            }
          },
        })
      `,
			errors: 1,
		},
		{
			name: `"switch" conditional await-get in classic function expression`,
			code: `
        selectorFamily({
          get: function () {
            return async function ({ get }) {
              const response = await fetch("https://api.github.com/users/jeremybanka")
              const json = await response.json()
              switch (json.type) {
                case "user":
                  return get(myRecordState)[json.key]
                default:
                  return null
              }
            }
          },
        })
      `,
			errors: 1,
		},
		{
			name: `get in a ternary expression after an await`,
			code: `
        const myRecordState = atom<Record<string, number>>({
          key: "myRecordState",
          default: {},
        })
        const mySelector = selector<number>({
          key: "mySelector",
          get: async ({ get }) => {
            const record = await get(myRecordState)
            const result = record.foo ? await get(myRecordState).foo : 0
            return result
          },
        })
      `,
			errors: 1,
		},
	],
})
