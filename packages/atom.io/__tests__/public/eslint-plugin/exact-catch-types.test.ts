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
			name: `atom typed with union type with two error types`,
			code: `
			  class SpecialError extends Error {
					special: true
				}
			  class FancyError extends Error {
					fancy: true
				}
		    const count = atom<number, SpecialError | FancyError>({
		      key: "count",
		      default: 0,
		      catch: [SpecialError, FancyError],
		    })
		  `,
		},
		{
			// technically 'valid', but typescript would error upstream
			name: `atom with catch property that's not an array`,
			code: `
        const count = atom<number, Error>({
          key: "count",
          default: 0,
          catch: Error,
        })
      `,
		},
		{
			// this would be a silly thing to try, but there's a code path for handling it, so
			name: `atom with catch property element that's not an identifier`,
			code: `
        const count = atom<number, Error>({
          key: "count",
          default: 0,
          catch: [class Whatever {}],
        })
      `,
		},
		{
			// doesn't freak out about other call expressions,
			name: `other call expressions`,
			code: `
        const count = atom<number, Error>({
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
			name: `atom with insufficient catch property (empty)`,
			code: `
				class SpecialError extends Error {
					special: true
				}
				const count = atom<number, SpecialError>({
					key: "count",
					default: 0,
					catch: [],
				})
			`,
			errors: [{ messageId: `missingCatchProperty` }],
		},
		{
			name: `atom with insufficient catch property (missed one)`,
			code: `
				class SpecialError extends Error {
					special: true
				}
				class FancyError extends Error {
					fancy: true
				}
				const count = atom<number, SpecialError>({
					key: "count",
					default: 0,
					catch: [SpecialError, FancyError],
				})
			`,
			errors: [{ messageId: `invalidCatchProperty` }],
		},
	],
})
