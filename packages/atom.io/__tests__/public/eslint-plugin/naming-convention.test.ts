import parser from "@typescript-eslint/parser"
import { Rules } from "atom.io/eslint-plugin"
import { RuleTester } from "eslint"

const ruleTester = new RuleTester({ languageOptions: { parser } })
Object.assign(ruleTester, { describe, it })
const rule = Rules.namingConvention

ruleTester.run(`atom`, rule, {
	valid: [
		{
			name: `happy path: variable ending in "Atom", with a key consistent with the variable name`,
			code: `
        const countAtom = atom({
          key: "count",
          default: 0,
        })
      `,
		},
		{
			name: `happy path (* import)`,
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
			name: `name does not end in "Atom" (* import)`,
			code: `
        const count = IO.atom({
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
		{
			name: `key is not consistent with the variable name (* import)`,
			code: `
        const countAtom = IO.atom({
          key: "number",
          default: 0,
        })
      `,
			errors: 1,
			output: `
        const countAtom = IO.atom({
          key: "count",
          default: 0,
        })
      `,
		},
	],
})
ruleTester.run(`atom family`, rule, {
	valid: [
		{
			name: `happy path: variable ending in "Atoms", with a key consistent with the variable name`,
			code: `
        const countAtoms = atomFamily({
          key: "count",
          default: 0,
        })
      `,
		},
	],
	invalid: [
		{
			name: `name does not end in "Atoms"`,
			code: `
        const counts = atomFamily({
          key: "count",
          default: 0,
        })
      `,
			errors: 1,
		},
		{
			name: `key is not consistent with the variable name`,
			code: `
        const countAtoms = atomFamily({
          key: "number",
          default: 0,
        })
      `,
			errors: 1,
			output: `
        const countAtoms = atomFamily({
          key: "count",
          default: 0,
        })
      `,
		},
	],
})
ruleTester.run(`mutable atom`, rule, {
	valid: [
		{
			name: `happy path: variable ending in "Atom", with a key consistent with the variable name`,
			code: `
        const userKeysAtom = mutableAtom({
          key: "userKeys",
          class: UList,
        })
      `,
		},
	],
	invalid: [
		{
			name: `name does not end in "Atom"`,
			code: `
        const userKeys = mutableAtom({
          key: "userKeys",
          class: UList,
        })
      `,
			errors: 1,
		},
		{
			name: `key is not consistent with the variable name`,
			code: `
        const userKeysAtom = mutableAtom({
          key: "userIds",
          class: UList,
        })
      `,
			errors: 1,
			output: `
        const userKeysAtom = mutableAtom({
          key: "userKeys",
          class: UList,
        })
      `,
		},
	],
})
ruleTester.run(`mutable atom family`, rule, {
	valid: [
		{
			name: `happy path: variable ending in "Atoms", with a key consistent with the variable name`,
			code: `
        const userGroupAtoms = mutableAtomFamily({
          key: "userGroup",
          class: UList,
        })
      `,
		},
	],
	invalid: [
		{
			name: `name does not end in "Atoms"`,
			code: `
        const userGroups = mutableAtomFamily({
          key: "userGroups",
          class: UList,
        })
      `,
			errors: 1,
		},
		{
			name: `key is not consistent with the variable name`,
			code: `
        const userGroupAtoms = mutableAtomFamily({
          key: "userCollections",
          class: UList,
        })
      `,
			errors: 1,
			output: `
        const userGroupAtoms = mutableAtomFamily({
          key: "userGroup",
          class: UList,
        })
      `,
		},
	],
})
ruleTester.run(`selector`, rule, {
	valid: [
		{
			name: `happy path: variable ending in "Selector", with a key consistent with the variable name`,
			code: `
        const userCountSelector = selector({
          key: "userCount",
          get: ({ get }) => get(userKeysAtom).size,
        })
      `,
		},
	],
	invalid: [
		{
			name: `name does not end in "Selector"`,
			code: `
        const userCounts = selector({
          key: "userCount",
          get: ({ get }) => get(userKeysAtom).size,
        })
      `,
			errors: 1,
		},
		{
			name: `key is not consistent with the variable name`,
			code: `
        const userCountSelector = selector({
          key: "howManyUsers",
          get: ({ get }) => get(userKeysAtom).size,
        })
      `,
			errors: 1,
			output: `
        const userCountSelector = selector({
          key: "userCount",
          get: ({ get }) => get(userKeysAtom).size,
        })
      `,
		},
	],
})
ruleTester.run(`selector family`, rule, {
	valid: [
		{
			name: `happy path: variable ending in "Selectors", with a key consistent with the variable name`,
			code: `
        const userGroupSizeSelectors = selectorFamily({
          key: "userGroupSize",
          get: (userGroupKey) => ({ get }) => get(userGroupAtoms, userGroupKey).size,
        })
      `,
		},
	],
	invalid: [
		{
			name: `name does not end in "Selectors"`,
			code: `
        const userGroupSizes = selectorFamily({
          key: "userGroupSize",
          get: (userGroupKey) => ({ get }) => get(userGroupAtoms, userGroupKey).size,
        })
      `,
			errors: 1,
		},
		{
			name: `key is not consistent with the variable name`,
			code: `
        const userGroupSizeSelectors = selectorFamily({
          key: "userGroupCounts",
          get: (userGroupKey) => ({ get }) => get(userGroupAtoms, userGroupKey).size,
        })
      `,
			errors: 1,
			output: `
        const userGroupSizeSelectors = selectorFamily({
          key: "userGroupSize",
          get: (userGroupKey) => ({ get }) => get(userGroupAtoms, userGroupKey).size,
        })
      `,
		},
	],
})

ruleTester.run(`EDGE CASES`, rule, {
	valid: [
		{
			name: `disregard function calls that aren't initializing state`,
			code: `
        const thing = whatever()
      `,
		},
		{
			name: `disregard if not under a variable declarator`,
			code: `
        atom({
          key: "count",
          default: 0,
        })
      `,
		},
		{
			name: `disregard if the config is missing`,
			code: `
        const countAtom = atom()
      `,
		},
		{
			name: `disregard if the config is not an object`,
			code: `
        const countAtom = atom("😵‍💫")
      `,
		},
		{
			name: `disregard if the config object is missing a key property`,
			code: `
        const countAtom = atom({})
      `,
		},
	],
	invalid: [
		{
			name: `handle template-style string literals`,
			code: `
        const countAtom = atom({
          key: \`number\`,
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
		{
			name: `handle actual template literals`,
			code: `
        const countAtom = atom({
          key: \`count$\{someWeirdThing}\`,
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
