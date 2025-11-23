import type { TSESTree } from "@typescript-eslint/utils"
import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils"
import type { InterfaceType, Type, TypeNode } from "typescript"

// We'll rename the rule to be more descriptive of both checks
const createRule = ESLintUtils.RuleCreator(
	(name) => `https://atom.io.fyi/docs/eslint-plugin#${name}`,
)

const STATE_FUNCTIONS_WITH_CATCH = [`atom`, `atomFamily`]

export const exactCatchTypes: ESLintUtils.RuleModule<
	`invalidCatchConstructor` | `missingCatchProperty`, // Added new messageId
	[],
	unknown,
	ESLintUtils.RuleListener
> = createRule({
	name: `catch-constructor-type`,
	meta: {
		type: `problem`,
		docs: {
			description: `Ensures that when an error type (E) is provided to an atom, the 'catch' property is set and all constructors in it are assignable to E.`,
		},
		messages: {
			missingCatchProperty:
				`The error type (E) was explicitly provided to '{{functionName}}', ` +
				`but the required 'catch' property is missing from the options object.`,
			invalidCatchConstructor:
				`The constructor '{{constructorName}}' in the 'catch' array is not assignable ` +
				`to the atom's declared error type '{{errorTypeName}}'. ` +
				`It might catch errors that the atom is not designed to handle.`,
		},
		schema: [], // No options needed
	},
	defaultOptions: [],
	// IMPORTANT: This rule requires type information from the parser
	create(context) {
		const parserServices = ESLintUtils.getParserServices(context)
		const checker = parserServices.program.getTypeChecker()

		return {
			CallExpression(node) {
				const { callee, typeArguments, arguments: callArguments } = node

				// 1. Check if the function call is one of the targeted state functions
				let functionName: string | null = null
				if (callee.type === AST_NODE_TYPES.Identifier) {
					if (STATE_FUNCTIONS_WITH_CATCH.includes(callee.name)) {
						functionName = callee.name
					}
				} else if (callee.type === AST_NODE_TYPES.MemberExpression) {
					if (
						callee.property.type === AST_NODE_TYPES.Identifier &&
						STATE_FUNCTIONS_WITH_CATCH.includes(callee.property.name)
					) {
						functionName = callee.property.name
					}
				}

				if (!functionName) return

				// 2. Check for explicit Error Type (E)
				if (
					typeArguments?.type !== AST_NODE_TYPES.TSTypeParameterInstantiation ||
					typeArguments.params.length < 2
				) {
					return // Error type E is not explicitly provided (defaults to 'never')
				}

				// The second type argument is the error type E
				const errorTypeNode = typeArguments.params[1]
				const optionsObject = callArguments[0]

				if (optionsObject?.type !== AST_NODE_TYPES.ObjectExpression) return

				// --- Find the 'catch' property for the original check ---
				let catchProperty: TSESTree.Property | undefined
				optionsObject.properties.forEach((property) => {
					if (property.type === AST_NODE_TYPES.Property) {
						if (
							(property.key.type === AST_NODE_TYPES.Identifier &&
								property.key.name === `catch`) ||
							(property.key.type === AST_NODE_TYPES.Literal &&
								property.key.value === `catch`)
						) {
							catchProperty = property
						}
					}
				})

				// 3. Perform the original 'missing catch' check
				if (!catchProperty) {
					context.report({
						node,
						messageId: `missingCatchProperty`,
						data: { functionName },
					})
					return // Stop here if 'catch' is entirely missing
				}

				// --- New Validation: Check Constructor Types ---
				const catchArray = catchProperty.value
				if (catchArray.type !== AST_NODE_TYPES.ArrayExpression) {
					// We only check array literals (e.g., [Ctor1, Ctor2])
					return
				}

				const typeNode = parserServices.esTreeNodeToTSNodeMap.get(
					errorTypeNode,
				) as TypeNode
				// Get the TypeScript Type object for E
				const errorTypeTs = checker.getTypeFromTypeNode(typeNode)

				const errorTypeName = checker.typeToString(errorTypeTs)

				// Iterate over each constructor reference in the 'catch' array
				for (const element of catchArray.elements) {
					if (!element || element.type !== AST_NODE_TYPES.Identifier) {
						// Only check simple identifier references (e.g., [ClientError])
						continue
					}

					// Get the type of the constructor identifier (e.g., the Type of 'Error')
					const constructorTsNode =
						parserServices.esTreeNodeToTSNodeMap.get(element)
					const constructorType = checker.getTypeAtLocation(constructorTsNode)
					const constructorName = element.name

					// Extract the instance type from the constructor type.
					// e.g., turn 'typeof ClientError' into 'ClientError'
					let instanceType: Type | undefined
					if (
						(constructorType as InterfaceType).getConstructSignatures().length >
						0
					) {
						// Get the return type of the constructor signature
						const signature = (
							constructorType as InterfaceType
						).getConstructSignatures()[0]
						instanceType = signature.getReturnType()
					}

					// If we couldn't get the instance type, skip the check
					if (!instanceType) continue

					// Check if the instance type is assignable to the declared error type E
					// This is the key semantic check that detects the problem:
					// Is 'Error' (the instance type) assignable to 'ClientError' (the errorTypeTs)? No.
					// Is 'ClientError' assignable to 'ClientError'? Yes.
					if (!checker.isTypeAssignableTo(instanceType, errorTypeTs)) {
						context.report({
							node: element, // Report specifically on the problematic constructor
							messageId: `invalidCatchConstructor`,
							data: {
								constructorName: constructorName,
								errorTypeName: errorTypeName,
							},
						})
					}
				}
			},
		}
	},
})
