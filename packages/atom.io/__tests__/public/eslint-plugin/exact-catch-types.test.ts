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
			name: `atom with no E type`,
			code: `
        const countState = atom<number>({
          key: "count",
          default: 0,
        })
      `,
		},
		{
			name: `annotated atom with no E type`,
			code: `
        const countState: AtomToken<number> = atom({
          key: "count",
          default: 0,
        })
      `,
		},
		{
			name: `atomFamily with no E type`,
			code: `
        const countState = atomFamily<number>({
          key: "count",
          default: 0,
        })
      `,
		},
		{
			name: `Silo.selector with no E type`,
			code: `
			  const $ = new Silo()
        const countState = $.selector<number>({
          key: "count",
          get: () => 0,
        })
      `,
		},
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
		{
			name: `atom typed with Error type with more specific catch property`,
			code: `
			  class SpecialError extends Error {
					special: true
				}
		    const count = atom<number, Error>({
		      key: "count",
		      default: 0,
		      catch: [SpecialError],
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
			name: `annotated atom typed Error missing catch property`,
			code: `
        const count: AtomToken<number, Error> = atom({
          key: "count",
          default: 0,
        })
      `,
			errors: [{ messageId: `missingCatchProperty` }],
		},
		{
			name: `atomFamily typed Error missing catch property`,
			code: `
        const count = atomFamily<number, string, Error>({
          key: "count",
          default: 0,
        })
		  `,
			errors: [{ messageId: `missingCatchProperty` }],
		},
		{
			name: `Silo.selector typed Error missing catch property`,
			code: `
				const $ = new Silo()
        const countState = $.selector<number, string, Error>({
          key: "count",
          get: () => 0,
        })
      `,
			errors: [{ messageId: `missingCatchProperty` }],
		},
		{
			name: `atom not typed Error with catch [Error]`,
			code: `
		    const count = atom<number>({
		      key: "count",
		      default: 0,
		      catch: [Error],
		    })
		  `,
			errors: [{ messageId: `hasExtraneousCatchProperty` }],
		},
		{
			name: `atom with insufficient catch property`,
			code: `
				class SpecialError extends Error {
					special: true
				}
				const count = atom<number, SpecialError>({
					key: "count",
					default: 0,
					catch: [Error],
				})
			`,
			errors: [{ messageId: `invalidCatchConstructor` }],
		},
	],
})
