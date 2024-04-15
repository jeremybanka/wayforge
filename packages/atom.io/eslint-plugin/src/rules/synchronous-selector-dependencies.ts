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
				if (`name` in node.callee && node.callee.name === `selector`) {
					let paramName: string | null = null
					const foundAwait = false
					if (node.arguments[0].type === `ObjectExpression`) {
						const destructuredGet = node.arguments[0].properties.find(
							(prop): prop is ESTree.AssignmentProperty =>
								`key` in prop && `name` in prop.key && prop.key.name === `get`,
						)
						if (destructuredGet && `name` in destructuredGet.key) {
							paramName = destructuredGet.key.name
						}
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
						const selectorComputation = selectorComputationProperty?.value
						if (
							selectorComputation?.type === `FunctionExpression` ||
							selectorComputation?.type === `ArrowFunctionExpression`
						) {
							let awaited: number | undefined
							let awaitNode: ESTree.AwaitExpression | undefined
							walk(selectorComputation, (n, depth) => {
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
										if (
											`name` in n.callee &&
											n.callee.name === `get` &&
											awaitNode
										) {
											context.report({
												node: awaitNode,
												message: `Using await before calling the 'get' transactor is not allowed.`,
											})
										}
										break
								}
							})
						}
					}
				}
			},
		}
	},
} satisfies Rule.RuleModule
