import type { TSESTree } from "@typescript-eslint/utils"
import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils"
import type {
	InterfaceType,
	Symbol as TsSymbol,
	Type,
	TypeNode,
} from "typescript"

const createRule = ESLintUtils.RuleCreator(
	(name) => `https://atom.io.fyi/docs/eslint-plugin#${name}`,
)

const STATE_FUNCTIONS_WITH_CATCH = [
	`atom`,
	`atomFamily`,
	`selector`,
	`selectorFamily`,
]
const STANDALONE_FUNCTIONS = [`atom`, `selector`]

export const exactCatchTypes: ESLintUtils.RuleModule<
	`extraneousCatchProperty` | `invalidCatchProperty` | `missingCatchProperty`,
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
				`The error type \`{{errorTypeName}}\` was explicitly provided to \`{{functionName}}\`, ` +
				`but the required 'catch' property is missing from the options object.`,
			invalidCatchProperty:
				`The constructor \`{{constructorName}}\` in the 'catch' array is not assignable ` +
				`to the atom's declared error type \`{{errorTypeName}}\`. ` +
				`It might catch errors that the atom is not designed to handle.`,
			extraneousCatchProperty: `A 'catch' property was provided to \`{{functionName}}\`, but no error type parameter was provided.`,
		},
		schema: [],
	},
	defaultOptions: [],
	create(context) {
		const parserServices = ESLintUtils.getParserServices(context)
		const checker = parserServices.program.getTypeChecker()

		return {
			CallExpression(node) {
				const {
					callee,
					typeArguments: directTypeArguments,
					arguments: callArguments,
				} = node

				// Check if the function call is one of the targeted state functions
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

				// Where do the type arguments come from?
				let typeArguments: TSESTree.TSTypeParameterInstantiation | undefined
				if (directTypeArguments) {
					typeArguments = directTypeArguments
				} else {
					const parent = node.parent
					if (
						parent?.type === AST_NODE_TYPES.VariableDeclarator &&
						parent.init === node
					) {
						// Check if the VariableDeclarator has an id with a TypeAnnotation
						const declaratorId = parent.id
						if (declaratorId.type === AST_NODE_TYPES.Identifier) {
							// Check for 'const myAtom: AtomToken<string> = ...'
							const typeAnnotation = declaratorId.typeAnnotation?.typeAnnotation
							if (
								typeAnnotation &&
								`typeArguments` in typeAnnotation &&
								typeAnnotation.typeArguments
							) {
								typeArguments = typeAnnotation.typeArguments
							}
						}
					}
				}

				const optionsObject = callArguments[0]

				if (optionsObject?.type !== AST_NODE_TYPES.ObjectExpression) return

				const isStandalone = STANDALONE_FUNCTIONS.includes(functionName)

				const errorTypeNode = typeArguments
					? isStandalone
						? typeArguments.params[1]
						: typeArguments.params[2]
					: undefined

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

				if (!errorTypeNode) {
					if (catchProperty) {
						context.report({
							node,
							messageId: `extraneousCatchProperty`,
							data: { functionName },
						})
						return
					}
					return
				}

				const typeNode = parserServices.esTreeNodeToTSNodeMap.get(
					errorTypeNode,
				) as TypeNode
				// Get the TypeScript Type object for E
				const errorTypeTs = checker.getTypeFromTypeNode(typeNode)
				const errorTypeName = checker.typeToString(errorTypeTs)

				if (!catchProperty) {
					context.report({
						node,
						messageId: `missingCatchProperty`,
						data: { functionName, errorTypeName },
					})
					return
				}

				// --- New Validation: Check Constructor Types ---
				const catchArray = catchProperty.value
				if (catchArray.type !== AST_NODE_TYPES.ArrayExpression) {
					// We only check array literals (e.g., [Ctor1, Ctor2])
					return
				}

				// 3. Collect all acceptable nominal symbols from E
				const acceptableErrorSymbols: TsSymbol[] = []

				// Check if E is a Union Type
				if (errorTypeTs.isUnion()) {
					// Add the symbol of every member of the union (e.g., Symbol(SpecialError), Symbol(FancyError))
					for (const memberType of errorTypeTs.types) {
						const symbol = memberType.getSymbol()
						if (symbol) {
							acceptableErrorSymbols.push(symbol)
						}
					}
				} else {
					// E is a single type, add its symbol
					const symbol = errorTypeTs.getSymbol()
					if (symbol) {
						acceptableErrorSymbols.push(symbol)
					}
				}

				if (catchArray.elements.length === 0) {
					context.report({
						node: catchProperty,
						messageId: `missingCatchProperty`,
						data: { functionName, errorTypeName },
					})
					return
				}

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

					// console.log(`constructorName`, constructorName)

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

					const constructorInstanceSymbol = instanceType?.getSymbol()

					// Check for symbol identity
					if (
						!constructorInstanceSymbol ||
						!acceptableErrorSymbols.includes(constructorInstanceSymbol)
					) {
						context.report({
							node: element,
							messageId: `invalidCatchProperty`,
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
