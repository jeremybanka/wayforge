import { ESLintUtils } from "@typescript-eslint/utils"

const createRule = ESLintUtils.RuleCreator(
	(name) => `https://atom.io.fyi/docs/eslint-plugin#${name}`,
)

const STATE_FUNCTIONS = [`atom`, `atomFamily`, `selector`, `selectorFamily`]

export const explicitStateTypes = createRule({
	name: `explicit-state-types`,
	meta: {
		type: `problem`,
		docs: {
			description: `State declarations must have generic type arguments directly passed to them`,
		},
		messages: {
			noTypeArgument: `State declarations must have generic type arguments directly passed to them.`,
		},
		schema: [], // no options
	},
	defaultOptions: [],
	create(context) {
		return {
			CallExpression(node) {
				const { callee } = node
				switch (callee.type) {
					case `Identifier`: {
						if (STATE_FUNCTIONS.includes(callee.name)) {
							if (!node.typeArguments) {
								context.report({
									node,
									messageId: `noTypeArgument`,
								})
							}
						}
						break
					}
					case `MemberExpression`: {
						if (
							callee.property.type === `Identifier` &&
							STATE_FUNCTIONS.includes(callee.property.name)
						) {
							if (!node.typeArguments) {
								context.report({
									node,
									messageId: `noTypeArgument`,
								})
							}
						}
					}
				}
			},
		}
	},
})
