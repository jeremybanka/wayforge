import type { ESLint } from "eslint"
import type * as ESTree from "estree"

export default {
	rules: {
		"no-get-after-await": {
			meta: {
				type: `problem`,
				docs: {
					description: `disallow await before calling get on the parameter's get method inside selector`,
					category: `Possible Errors`,
					recommended: false,
					url: ``, // URL to documentation page for this rule
				},
				schema: [], // no options
			},
			create(context) {
				return {
					FunctionExpression(node) {
						if (
							`key` in node.parent &&
							`name` in node.parent.key &&
							node.parent.key.name === `get`
						) {
							let paramName: string | null = null
							let foundAwait = false

							// Check if parameter is destructured
							if (node.params[0] && node.params[0].type === `ObjectPattern`) {
								const destructuredGet = node.params[0].properties.find(
									(prop): prop is ESTree.AssignmentProperty =>
										`key` in prop &&
										`name` in prop.key &&
										prop.key.name === `get`,
								)
								if (destructuredGet) {
									if (`name` in destructuredGet.value) {
										paramName = destructuredGet.value.name
									}
								}
							} else if (
								node.params[0] &&
								node.params[0].type === `Identifier`
							) {
								paramName = node.params[0].name
							}

							for (const statement of node.body.body) {
								if (
									statement.type === `ExpressionStatement` &&
									statement.expression.type === `AwaitExpression`
								) {
									foundAwait = true
								}
								if (foundAwait) {
									if (
										statement.type === `ExpressionStatement` &&
										statement.expression.type === `CallExpression`
									) {
										const callee = statement.expression.callee
										// Check for both destructured and non-destructured usage
										if (
											(callee.type === `Identifier` && callee.name === `get`) ||
											(callee.type === `MemberExpression` &&
												`name` in callee.object &&
												callee.object.name === paramName &&
												`name` in callee.property &&
												callee.property.name === `get`)
										) {
											context.report({
												node: statement,
												message: `Using await before calling the 'get' transactor is not allowed.`,
											})
										}
									}
								}
							}
						}
					},
				}
			},
		},
	},
} satisfies ESLint.Plugin
