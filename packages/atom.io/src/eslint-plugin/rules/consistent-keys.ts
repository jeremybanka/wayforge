import type { RuleType } from "@eslint/core"
import type { Rule } from "eslint"
import type * as ESTree from "estree"

const SUFFIX_DICTIONARY = {
	atom: `Atom`,
	atomFamily: `Atoms`,
	mutableAtom: `Atom`,
	mutableAtomFamily: `Atoms`,
	selector: `Selector`,
	selectorFamily: `Selectors`,
} as const

const PLURAL_DICTIONARY = {
	atom: `atoms`,
	atomFamily: `atom families`,
	mutableAtom: `atoms`,
	mutableAtomFamily: `atom families`,
	selector: `selectors`,
	selectorFamily: `selector families`,
}

export const consistentAtomNamesAndKeys: {
	meta: {
		type: RuleType
		docs: {
			description: string
			category: string
			recommended: boolean
			url: string
		}
		fixable: `code`
		schema: never[]
	}
	create(context: Rule.RuleContext): Rule.NodeListener
} = {
	meta: {
		type: `problem`,
		docs: {
			description: `enforce atom variable names to match their key property`,
			category: `Best Practices`,
			recommended: false,
			url: ``,
		},
		fixable: `code`,
		schema: [],
	},

	create(context) {
		return {
			CallExpression(node) {
				// atom(...)
				if (node.callee.type !== `Identifier`) {
					return
				}

				switch (node.callee.name) {
					case `atom`:
					case `atomFamily`:
					case `mutableAtom`:
					case `mutableAtomFamily`:
					case `selector`:
					case `selectorFamily`:
						break // ^ targets of this rule
					default:
						return
				}

				// Must be assigned: const x = atom(...)
				if (node.parent?.type !== `VariableDeclarator`) return
				if (node.parent.init !== node) return
				if (node.parent.id.type !== `Identifier`) return

				const calleeName = node.callee.name as keyof typeof SUFFIX_DICTIONARY
				const suffix = SUFFIX_DICTIONARY[calleeName]
				const plural = PLURAL_DICTIONARY[calleeName]

				const variableName = node.parent.id.name

				// Enforce FooAtom naming
				if (!variableName.endsWith(suffix)) {
					context.report({
						node: node.parent.id,
						message: `Names of ${plural} should end with '${suffix}'.`,
					})
					return
				}

				const expectedKey = variableName.slice(0, -suffix.length)

				// Must have first argument object
				const arg = node.arguments[0]
				if (arg?.type !== `ObjectExpression`) return

				// Find key property
				const keyProp = arg.properties.find(
					(prop): prop is ESTree.Property =>
						prop.type === `Property` &&
						((prop.key.type === `Identifier` && prop.key.name === `key`) ||
							(prop.key.type === `Literal` && prop.key.value === `key`)),
				)

				if (!keyProp) return

				// Must be string literal or template literal
				if (
					keyProp.value.type !== `Literal` ||
					typeof keyProp.value.value !== `string`
				) {
					if (keyProp.value.type !== `TemplateLiteral`) return
				}

				const actualKey =
					keyProp.value.type === `Literal`
						? keyProp.value.value
						: keyProp.value.quasis[0].value.raw

				if (
					actualKey !== expectedKey ||
					(`quasis` in keyProp.value && keyProp.value.quasis.length > 1)
				) {
					context.report({
						node: keyProp.value,
						message: `Keys of ${plural} should be consistent with the names of their variables.`,
						fix(fixer) {
							return fixer.replaceText(
								keyProp.value,
								JSON.stringify(expectedKey),
							)
						},
					})
				}
			},
		}
	},
} satisfies Rule.RuleModule
