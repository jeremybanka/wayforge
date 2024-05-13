import type { Rule } from "eslint"
import type * as ESTree from "estree"

import { walk } from "../walk"

export const lifespan = {
	meta: {
		type: `problem`,
		docs: {
			description: `atom.io provides tools for short-lived (ephemeral) and long-lived (immortal) stores. This rule allows you to guard against unsafe usage of tools for the other type of store.`,
			category: `Possible Errors`,
			recommended: false,
			url: ``, // URL to documentation page for this rule
		},
		schema: [
			{
				type: `string`,
				enum: [`ephemeral`, `immortal`],
				default: `ephemeral`,
			},
		],
	},
	create(context) {
		const storeLifespan = (context.options[0] ?? `ephemeral`) as
			| `ephemeral`
			| `immortal`
		return {
			ImportDeclaration(node) {
				const importSource = node.source.value as string
				if (!importSource.startsWith(`atom.io/`)) {
					return
				}
				const [_, subPackageName] = importSource.split(`/`)
				if (
					(storeLifespan === `ephemeral` && subPackageName === `immortal`) ||
					(storeLifespan === `immortal` && subPackageName === `ephemeral`)
				) {
					context.report({
						node,
						message: `do not import from "${importSource}" in an ${storeLifespan} store`,
					})
				}
			},
			// don't allow use of the `find` transactor in selector get/set or transaction do
			CallExpression(node) {
				if (storeLifespan === `ephemeral`) {
					return
				}
				const storeProcedures: (
					| ESTree.ArrowFunctionExpression
					| ESTree.FunctionExpression
				)[] = []
				if (`name` in node.callee) {
					if (
						node.callee.name === `selector` ||
						node.callee.name === `selectorFamily` ||
						node.callee.name === `transaction`
					) {
						if (node.arguments[0].type === `ObjectExpression`) {
							const argProperties = node.arguments[0].properties
							switch (node.callee.name) {
								case `selector`:
								case `selectorFamily`:
									{
										const getAndSetProps = argProperties.filter(
											(prop): prop is ESTree.Property => {
												return (
													`key` in prop &&
													`name` in prop.key &&
													(prop.key.name === `get` || prop.key.name === `set`)
												)
											},
										)
										switch (node.callee.name) {
											case `selector`:
												{
													for (const prop of getAndSetProps) {
														if (
															prop.value.type === `FunctionExpression` ||
															prop.value.type === `ArrowFunctionExpression`
														) {
															console.log(prop.value)
															storeProcedures.push(prop.value)
														}
													}
												}
												break
											case `selectorFamily`:
												{
													for (const prop of getAndSetProps) {
														const { value } = prop
														if (
															value.type === `FunctionExpression` ||
															value.type === `ArrowFunctionExpression`
														) {
															if (value.body.type === `BlockStatement`) {
																for (const statement of value.body.body) {
																	if (
																		statement.type === `ReturnStatement` &&
																		statement.argument &&
																		(statement.argument.type ===
																			`FunctionExpression` ||
																			statement.argument.type ===
																				`ArrowFunctionExpression`)
																	) {
																		storeProcedures.push(statement.argument)
																	}
																}
															} else if (
																value.body.type === `FunctionExpression` ||
																value.body.type === `ArrowFunctionExpression`
															) {
																storeProcedures.push(value.body)
															}
														}
													}
												}
												break
										}
									}
									break

								case `transaction`:
									{
										const doProp = argProperties.find(
											(prop): prop is ESTree.Property => {
												return (
													`key` in prop &&
													`name` in prop.key &&
													prop.key.name === `do`
												)
											},
										)
										if (doProp) {
											if (
												doProp.value.type === `FunctionExpression` ||
												doProp.value.type === `ArrowFunctionExpression`
											) {
												storeProcedures.push(doProp.value)
											}
										}
									}
									break
							}
						}
					}
				}
				for (const storeProcedure of storeProcedures) {
					const transactorsParam = storeProcedure.params[0]
					const nonDestructuredTransactorsName =
						transactorsParam && `name` in transactorsParam
							? transactorsParam.name
							: undefined
					walk(storeProcedure.body, (n) => {
						// console.log(`${`\t`.repeat(depth)}${n.type} ${n.name ?? ``}`)
						if (n.type === `CallExpression`) {
							let willReport = false
							switch (n.callee.type) {
								case `MemberExpression`:
									if (
										n.callee.object.type === `Identifier` &&
										n.callee.object.name === nonDestructuredTransactorsName &&
										n.callee.property.type === `Identifier` &&
										n.callee.property.name === `find`
									) {
										willReport = true
									}
									break
								case `Identifier`:
									if (n.callee.name === `find`) {
										willReport = true
									}
									break
							}
							if (willReport) {
								context.report({
									node: n,
									message: `Using find in a transactor is not allowed in an immortal store.`,
								})
							}
						}
					})
				}
			},
			// don't allow use of any function or method called `findState`
		}
	},
} satisfies Rule.RuleModule
