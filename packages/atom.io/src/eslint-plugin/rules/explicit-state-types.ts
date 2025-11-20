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

// 1. Define the Rule Options Type
type Options = [
	{
		allowTopLevelTypeAnnotation?: boolean
	},
]

export const explicitStateTypes: ESLintUtils.RuleModule<
	`noTypeArgument`,
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
		},
		// 2. Define the Schema for the Opt-in Option
		schema: [
			{
				type: `object`,
				properties: {
					allowTopLevelTypeAnnotation: {
						type: `boolean`,
						default: false, // Defaulting to 'false' makes it opt-in
					},
				},
				additionalProperties: false,
			},
		],
	},
	defaultOptions: [
		{
			allowTopLevelTypeAnnotation: false,
		},
	], // Provide a default for options
	create(context) {
		// 3. Access the Opt-in Option
		// const [{ allowTopLevelTypeAnnotation }] = context.options
		const options = context.options[0]
		const allowTopLevelTypeAnnotation =
			options?.allowTopLevelTypeAnnotation ?? false

		/**
		 * Checks if the CallExpression is part of a variable declaration
		 * with a top-level TypeAnnotation (e.g., const x: Type = call()).
		 */
		function hasTopLevelTypeAnnotation(node: TSESTree.CallExpression): boolean {
			if (!allowTopLevelTypeAnnotation) {
				return false // If the option is disabled, always return false
			}

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
				// Helper to check if the function call is one of the targeted state functions
				const isStateFunctionCall = (callee: TSESTree.Expression) => {
					switch (callee.type) {
						case `Identifier`:
							return STATE_FUNCTIONS.includes(callee.name)
						case `MemberExpression`:
							return (
								callee.property.type === `Identifier` &&
								STATE_FUNCTIONS.includes(callee.property.name)
							)
						default:
							return false
					}
				}

				// Check if the current node is a call to a state function
				if (!isStateFunctionCall(node.callee)) {
					return // Not a targeted function call, exit early
				}

				// Check for the *required* generic type argument first
				if (node.typeArguments) {
					return // Generic type argument is present, no error
				}

				// 4. Implement the new Carveout/Exception
				// If generic arguments are missing, check if the top-level annotation exception is enabled AND present
				if (allowTopLevelTypeAnnotation && hasTopLevelTypeAnnotation(node)) {
					return // Exception met: type annotation is on the variable declaration
				}

				// If all checks fail (no generic type, and no allowed top-level type), report the error
				context.report({
					node,
					messageId: `noTypeArgument`,
				})
			},
		}
	},
})
