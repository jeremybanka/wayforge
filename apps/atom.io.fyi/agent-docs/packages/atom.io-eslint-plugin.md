# atom.io/eslint-plugin

Source: src/pages/docs/eslint-plugin.mdx
URL: /docs/eslint-plugin

# atom.io/eslint-plugin

`atom.io/eslint-plugin` provides rules that keep atom.io state declarations explicit,
consistent, and safe around typed errors.

## install

If your project already depends on `atom.io`, the plugin is already available from that
package. For a minimal TypeScript flat config, you also need ESLint and
`typescript-eslint`:

### install eslint

```bash
pnpm add -D eslint typescript-eslint
```

## minimal flat config

Here is a small `eslint.config.ts` that starts from `typescript-eslint`'s recommended
type-checked rules and adds the atom.io rules.

### eslint
Source: src/exhibits/tooling/eslint-plugin/eslint.config.ts.txt

```ts
import atomIO from "atom.io/eslint-plugin"
import tseslint from "typescript-eslint"

export default tseslint.config(
	{
		ignores: ["dist/**", "node_modules/**"],
	},
	...tseslint.configs.recommendedTypeChecked,
	{
		files: ["**/*.{ts,tsx}"],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		plugins: {
			"atom.io": atomIO,
		},
		rules: {
			"atom.io/exact-catch-types": "error",
			"atom.io/explicit-state-types": "error",
			"atom.io/naming-convention": "error",
		},
	},
)
```

Why use `recommendedTypeChecked` instead of plain `recommended`?

`atom.io/exact-catch-types` needs TypeScript type information so it can compare an
atom's error type with its `catch` constructors. If you want a syntax-only ESLint setup,
use `typescript-eslint`'s plain recommended config and leave out
`atom.io/exact-catch-types`.

## rules

### explicit-state-types

`atom.io/explicit-state-types` requires state declarations to include explicit type
arguments.

### explicit state types
Source: src/exhibits/tooling/eslint-plugin/explicit-state-types.ts

```ts
import { atom, atomFamily } from "atom.io"

type User = {
	id: string
	name: string
}

export const countAtom = atom<number>({
	key: `count`,
	default: 0,
})

export const userAtoms = atomFamily<User, string>({
	key: `user`,
	default: (id) => ({ id, name: `` }),
})
```

This keeps important state types visible at the declaration site, where they are easiest
to audit.

### naming-convention

`atom.io/naming-convention` keeps declaration variable names and state keys aligned.

### explicit state types
Source: src/exhibits/tooling/eslint-plugin/explicit-state-types.ts

```ts
import { atom, atomFamily } from "atom.io"

type User = {
	id: string
	name: string
}

export const countAtom = atom<number>({
	key: `count`,
	default: 0,
})

export const userAtoms = atomFamily<User, string>({
	key: `user`,
	default: (id) => ({ id, name: `` }),
})
```

For example, `countAtom` should use `key: "count"`, and `userAtoms` should use
`key: "user"`. The same pattern applies to `selector`, `selectorFamily`,
`mutableAtom`, and `mutableAtomFamily`.

### exact-catch-types

`atom.io/exact-catch-types` checks that a state declaration's typed error channel
matches the constructors listed in its `catch` option.

### exact catch types
Source: src/exhibits/tooling/eslint-plugin/exact-catch-types.ts

```ts
import { atom } from "atom.io"

type Profile = {
	name: string
}

class RequestError extends Error {}

export const profileAtom = atom<Profile, RequestError>({
	key: `profile`,
	default: async () => {
		const response = await fetch(`/api/profile`)
		if (!response.ok) {
			throw new RequestError()
		}
		return response.json()
	},
	catch: [RequestError],
})
```

This helps prevent state from advertising that it may catch one error type while actually
catching another.
