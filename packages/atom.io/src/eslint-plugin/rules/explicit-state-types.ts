/* eslint-disable @typescript-eslint/switch-exhaustiveness-check */
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
					let hasAnnotation = false
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
							hasAnnotation = Boolean(declaratorId.typeAnnotation)
						}
					}
					if (hasAnnotation) {
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
