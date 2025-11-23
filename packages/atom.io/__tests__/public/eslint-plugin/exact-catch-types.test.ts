import * as path from "node:path"

import { RuleTester } from "@typescript-eslint/rule-tester"
import { Rules } from "atom.io/eslint-plugin"

const ruleTester = new RuleTester({
	languageOptions: {
		parserOptions: {
			projectService: {
				allowDefaultProject: [`*.ts*`],
			},
			tsconfigRootDir: path.join(__dirname, `../..`),
		},
	},
})
Object.assign(ruleTester, { describe, it })
const rule = Rules.exactCatchTypes

ruleTester.run(`exact-catch-types`, rule, {
	valid: [
		{
			name: `atom typed Error with catch [Error]`,
			code: `
        const countState = atom<number, Error>({
          key: "count",
          default: 0,
          catch: [Error],
        })
      `,
		},
	],
	invalid: [
		{
			name: `atom typed Error missing catch property`,
			code: `
        const count = atom<number, Error>({
          key: "count",
          default: 0,
        })
      `,
			errors: [{ messageId: `missingCatchProperty` }],
		},
		{
			name: `atom`,
			code: `
		    const count = atom<number>({
		      key: "count",
		      default: 0,
		      catch: [Error],
		    })
		  `,
			errors: [{ messageId: `hasExtraneousCatchProperty` }],
		},
	],
})
