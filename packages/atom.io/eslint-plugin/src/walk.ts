import type * as ESTree from "estree"

export function walk(
	node: ESTree.Node,
	callback: (node: ESTree.Node, depth: number) => void,
	depth = 0,
): void {
	callback(node, depth)

	switch (node.type) {
		case `AwaitExpression`:
			walk(node.argument, callback, depth + 1)
			break
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
		case `ConditionalExpression`:
			walk(node.test, callback, depth + 1)
			walk(node.consequent, callback, depth + 1)
			walk(node.alternate, callback, depth + 1)
			break
		case `MemberExpression`:
			walk(node.object, callback, depth)
			walk(node.property, callback, depth)
			break
		case `CallExpression`:
			walk(node.callee, callback, depth)
			for (const argument of node.arguments) {
				walk(argument, callback, depth)
			}
			break
	}
}
