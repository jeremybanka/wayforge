/* eslint-disable @typescript-eslint/switch-exhaustiveness-check */
import type { TSESTree } from "@typescript-eslint/utils"
import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils"

const createRule = ESLintUtils.RuleCreator(
	(name) => `https://atom.io.fyi/docs/eslint-plugin#${name}`,
)

const STATE_FUNCTIONS = [
	`atom`,
	`atomFamily`,
	`mutableAtom`,
	`mutableAtomFamily`,
	`selector`,
	`selectorFamily`,
]

type Options = [
	{
		permitAnnotation?: boolean
	},
]

export const explicitStateTypes: ESLintUtils.RuleModule<
	`noTypeArgument` | `noTypeArgumentOrAnnotation`,
	Options,
	unknown,
	ESLintUtils.RuleListener
> = createRule({
	name: `explicit-state-types`,
	meta: {
		type: `problem`,
		docs: {
			description: `State declarations must have generic type arguments directly passed to them`,
		},
		messages: {
			noTypeArgument: `State declarations must have generic type arguments directly passed to them.`,
			noTypeArgumentOrAnnotation: `State declarations must have generic type arguments directly passed to them, or a top-level type annotation.`,
		},
		schema: [
			{
				type: `object`,
				properties: {
					permitAnnotation: {
						type: `boolean`,
						default: false,
					},
				},
				additionalProperties: false,
			},
		],
	},
	defaultOptions: [
		{
			permitAnnotation: false,
		},
	],
	create(context) {
		const options = context.options[0]
		const permitAnnotation = options?.permitAnnotation ?? false

		/**
		 * Checks if the CallExpression is part of a variable declaration
		 * with a top-level TypeAnnotation (e.g., const x: Type = call()).
		 */
		function hasTypeAnnotation(node: TSESTree.CallExpression): boolean {
			// Check if the CallExpression is the initializer of a variable declarator
			const parent = node.parent
			if (
				parent?.type === AST_NODE_TYPES.VariableDeclarator &&
				parent.init === node
			) {
				// Check if the VariableDeclarator has an id with a TypeAnnotation
				const declaratorId = parent.id
				if (declaratorId.type === AST_NODE_TYPES.Identifier) {
					// Check for 'const myAtom: AtomToken<string> = ...'
					return !!declaratorId.typeAnnotation
				}
			}

			// For the purposes of this rule, we only check simple variable declarations
			return false
		}

		return {
			CallExpression(node) {
				const callee = node.callee

				switch (callee.type) {
					case `Identifier`:
						if (STATE_FUNCTIONS.includes(callee.name) === false) {
							return
						}
						break
					case `MemberExpression`:
						if (
							(callee.property.type === `Identifier` &&
								STATE_FUNCTIONS.includes(callee.property.name)) === false
						) {
							return
						}
						break
					default:
						return
				}

				// Check for the *required* generic type argument first
				if (node.typeArguments) {
					return // Generic type argument is present, no error
				}

				// If generic arguments are missing, check if the top-level annotation exception is enabled AND present
				if (permitAnnotation) {
					if (hasTypeAnnotation(node)) {
						return // Exception met: type annotation is on the variable declaration
					}
					context.report({
						node,
						messageId: `noTypeArgumentOrAnnotation`,
					})
					return
				}

				context.report({
					node,
					messageId: `noTypeArgument`,
				})
			},
		}
	},
})
