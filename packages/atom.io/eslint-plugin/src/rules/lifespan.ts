import type { Rule } from "eslint"
import type * as ESTree from "estree"

export const lifespan = {
	meta: {
		type: `problem`,
		docs: {
			description: `atom.io provides tools for short-lived (ephemeral) and long-lived (immortal) stores. This rule allows you to guard against unsafe usage of tools for the other type of store.`,
			category: `Possible Errors`,
			recommended: false,
			url: ``, // URL to documentation page for this rule
		},
		schema: [
			{
				type: `string`,
				enum: [`ephemeral`, `immortal`],
				default: `ephemeral`,
			},
		],
	},
	create(context) {
		const storeLifespan = (context.options[0] ?? `ephemeral`) as
			| `ephemeral`
			| `immortal`
		return {
			ImportDeclaration(node) {
				const importSource = node.source.value as string
				if (!importSource.startsWith(`atom.io/`)) {
					return
				}
				const [_, subPackageName] = importSource.split(`/`)
				if (!subPackageName) {
					return
				}
				if (
					(storeLifespan === `ephemeral` && subPackageName === `immortal`) ||
					(storeLifespan === `immortal` && subPackageName === `ephemeral`)
				) {
					context.report({
						node,
						message: `do not import from "${importSource}" in an ${storeLifespan} store`,
					})
				}
			},
		}
	},
} satisfies Rule.RuleModule
