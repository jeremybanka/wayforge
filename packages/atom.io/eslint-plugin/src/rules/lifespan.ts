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
				if (storeLifespan === `immortal` && subPackageName === `ephemeral`) {
					context.report({
						node,
						message: `do not import from "${importSource}" in an ${storeLifespan} store`,
					})
				}
			},

			CallExpression(node) {
				if (storeLifespan === `ephemeral`) {
					return
				}

				const functionCallee =
					node.callee.type === `Identifier` ? node.callee : undefined
				const methodCallee =
					node.callee.type === `MemberExpression` &&
					node.callee.property.type === `Identifier`
						? node.callee.property
						: undefined
				const callee = functionCallee ?? methodCallee

				if (callee === undefined) {
					return
				}

				if (callee.name === `findState`) {
					context.report({
						node,
						message: `do not use findState in an ${storeLifespan} store`,
					})
				}

				const storeProcedures: (
					| ESTree.ArrowFunctionExpression
					| ESTree.FunctionExpression
				)[] = []
				if (
					callee.name === `selector` ||
					callee.name === `selectorFamily` ||
					callee.name === `transaction`
				) {
					if (node.arguments[0].type === `ObjectExpression`) {
						const argProperties = node.arguments[0].properties
						switch (callee.name) {
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
									switch (callee.name) {
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
		}
	},
} satisfies Rule.RuleModule
