import parser from "@typescript-eslint/parser"
import { Rules } from "atom.io/eslint-plugin"
import { RuleTester } from "eslint-v9"

const ruleTester = new RuleTester({ languageOptions: { parser } })
Object.assign(ruleTester, { describe, it })
const rule = Rules.lifespan

ruleTester.run(`lifespan`, rule, {
	valid: [
		{
			name: `import from ephemeral with no option set`,
			code: `
        import * as Ephemeral from "atom.io/ephemeral"
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
	],
	invalid: [
		{
			name: `import from immortal with no option set`,
			code: `
        import * as Immortal from "atom.io/immortal"
      `,
			errors: 1,
		},
		{
			name: `import from immortal with ephemeral option set`,
			options: [`ephemeral`],
			code: `
        import * as Immortal from "atom.io/immortal"
      `,
			errors: 1,
		},
		{
			name: `import from ephemeral with immortal option set`,
			options: [`immortal`],
			code: `
        import * as Ephemeral from "atom.io/ephemeral"
      `,
			errors: 1,
		},
	],
})
