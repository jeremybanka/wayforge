import { RuleTester } from "eslint"

import { Rules } from "atom.io/eslint-plugin"

const ruleTester = new RuleTester()
Object.assign(ruleTester, { describe, it })
const rule = Rules.synchronousSelectorDependencies

ruleTester.run(`synchronous-selector-dependencies`, rule, {
	valid: [
		{
			code: `
        const doubleState = selector({
          key: "double",
          get: (transactors) => transactors.get(countState) * 2,
        })
      `,
		},
		{
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
			code: `
        const doubleState = selector({
          key: "double",
          get: function ({ get }) {
            return get(countState) * 2
          },
        })
      `,
		},
	],
	invalid: [
		{
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
