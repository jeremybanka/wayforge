import parser from "@typescript-eslint/parser"
import { Rules } from "atom.io/eslint-plugin"
import { RuleTester } from "eslint"

const ruleTester = new RuleTester({ languageOptions: { parser } })
Object.assign(ruleTester, { describe, it })
const rule = Rules.consistentAtomNamesAndKeys

ruleTester.run(`atom`, rule, {
	valid: [
		{
			name: `happy path: atom variable ending in "Atom", with a key consistent with the variable name`,
			code: `
        const countAtom = atom({
          key: "count",
          default: 0,
        })
      `,
		},
		{
			name: `happy path: but atom is from * import`,
			code: `
        const countAtom = IO.atom({
          key: "count",
          default: 0,
        })
      `,
		},
	],
	invalid: [
		{
			name: `name does not end in "Atom"`,
			code: `
        const count = atom({
          key: "count",
          default: 0,
        })
      `,
			errors: 1,
		},
		{
			name: `key is not consistent with the variable name`,
			code: `
        const countAtom = atom({
          key: "number",
          default: 0,
        })
      `,
			errors: 1,
			output: `
        const countAtom = atom({
          key: "count",
          default: 0,
        })
      `,
		},
	],
})
