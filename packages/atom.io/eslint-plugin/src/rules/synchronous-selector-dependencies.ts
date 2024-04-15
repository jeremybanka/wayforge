import type { Rule } from "eslint"
import type * as ESTree from "estree"

function walk(
	node: ESTree.Node,
	callback: (node: ESTree.Node, depth: number) => void,
	depth = 0,
) {
	callback(node, depth)

	switch (node.type) {
		case `FunctionDeclaration`:
		case `FunctionExpression`:
		case `ArrowFunctionExpression`:
			for (const param of node.params) {
				walk(param, callback, depth + 1)
			}
			walk(node.body, callback, depth + 1)
			break
		case `BlockStatement`:
			for (const statement of node.body) {
				walk(statement, callback, depth + 1)
			}
			break
		case `IfStatement`:
			walk(node.test, callback, depth)
			walk(node.consequent, callback, depth)
			if (node.alternate) {
				walk(node.alternate, callback, depth)
			}
			break
		case `SwitchStatement`:
			walk(node.discriminant, callback, depth + 1)
			for (const caseOrDefault of node.cases) {
				walk(caseOrDefault, callback, depth)
			}
			break
		case `ReturnStatement`:
			if (node.argument) {
				walk(node.argument, callback, depth)
			}
			break
		case `SwitchCase`:
			if (node.test) {
				walk(node.test, callback, depth)
			}
			for (const statement of node.consequent) {
				walk(statement, callback, depth)
			}
			break
		case `VariableDeclaration`:
			for (const declaration of node.declarations) {
				walk(declaration, callback, depth)
				if (declaration.init) {
					walk(declaration.init, callback, depth)
				}
			}
			break
		case `BinaryExpression`:
			walk(node.left, callback, depth)
			walk(node.right, callback, depth)
			break
		case `MemberExpression`:
			walk(node.object, callback, depth)
			walk(node.property, callback, depth)
			break
	}
}

export const synchronousSelectorDependencies = {
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
			CallExpression(node) {
				let selectorComputation: ESTree.Node | undefined
				if (`name` in node.callee && node.callee.name === `selectorFamily`) {
					if (node.arguments[0].type === `ObjectExpression`) {
						const selectorLookupProperty = node.arguments[0].properties.find(
							(prop): prop is ESTree.Property => {
								return (
									`key` in prop && `name` in prop.key && prop.key.name === `get`
								)
							},
						)
						const selectorLookup = selectorLookupProperty?.value
						if (
							selectorLookup?.type === `FunctionExpression` ||
							selectorLookup?.type === `ArrowFunctionExpression`
						) {
							if (selectorLookup.body.type === `BlockStatement`) {
								for (const statement of selectorLookup.body.body) {
									if (
										statement.type === `ReturnStatement` &&
										statement.argument
									) {
										selectorComputation = statement.argument
									}
								}
							} else if (
								selectorLookup.body.type === `FunctionExpression` ||
								selectorLookup.body.type === `ArrowFunctionExpression`
							) {
								selectorComputation = selectorLookup.body
							}
						}
					}
				}
				if (`name` in node.callee && node.callee.name === `selector`) {
					if (node.arguments[0].type === `ObjectExpression`) {
						const selectorComputationProperty =
							node.arguments[0].properties.find(
								(prop): prop is ESTree.Property => {
									return (
										`key` in prop &&
										`name` in prop.key &&
										prop.key.name === `get`
									)
								},
							)
						selectorComputation = selectorComputationProperty?.value
					}
				}
				if (
					selectorComputation?.type === `FunctionExpression` ||
					selectorComputation?.type === `ArrowFunctionExpression`
				) {
					const nonDestructuredTransactorsName =
						selectorComputation.params[0] &&
						`name` in selectorComputation.params[0]
							? selectorComputation.params[0].name
							: undefined
					let awaited: number | undefined
					let awaitNode: ESTree.AwaitExpression | undefined
					walk(selectorComputation, (n, depth) => {
						// console.log(`${`\t`.repeat(depth)}${n.type} ${n.name ?? ``}`)
						if (typeof awaited === `number`) {
							if (awaited > depth) {
								awaited = undefined
								awaitNode = undefined
							}
						}
						switch (n.type) {
							case `AwaitExpression`:
								awaited = depth
								awaitNode = n
								break
							case `CallExpression`:
								if (awaitNode) {
									let willReport = false
									switch (n.callee.type) {
										case `MemberExpression`:
											if (
												n.callee.object.type === `Identifier` &&
												n.callee.object.name ===
													nonDestructuredTransactorsName &&
												n.callee.property.type === `Identifier` &&
												n.callee.property.name === `get`
											) {
												willReport = true
											}
											break
										case `Identifier`:
											if (n.callee.name === `get`) {
												willReport = true
											}
											break
									}
									if (willReport) {
										context.report({
											node: awaitNode,
											message: `Using await before calling the 'get' transactor is not allowed.`,
										})
									}
								}
						}
					})
				}
			},
		}
	},
} satisfies Rule.RuleModule
