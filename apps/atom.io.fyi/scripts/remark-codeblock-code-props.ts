type MdxNode = Record<string, unknown>

type MdxAttribute = MdxNode & {
	name?: unknown
	value?: {
		value?: unknown
		data?: {
			estree?: {
				body?: Array<{
					expression?: {
						type?: unknown
						expressions?: unknown[]
						quasis?: unknown[]
					}
				}>
			}
		}
	}
}

type StaticCodeAttribute = MdxAttribute & {
	value: {
		value: string
		data: {
			estree: {
				body: [
					{
						expression: MdxNode & {
							type: unknown
							expressions?: unknown[]
							quasis?: unknown[]
						}
					},
				]
			}
		}
	}
}

function visit(node: unknown, visitor: (node: MdxNode) => void): void {
	if (node === null || typeof node !== `object`) {
		return
	}
	if (Array.isArray(node)) {
		for (const child of node) {
			visit(child, visitor)
		}
		return
	}
	visitor(node as MdxNode)
	for (const value of Object.values(node)) {
		visit(value, visitor)
	}
}

function hasStaticTemplateLiteral(
	attribute: MdxAttribute,
): attribute is StaticCodeAttribute {
	const value = attribute.value
	if (value === undefined) {
		return false
	}
	const expression = value.data?.estree?.body?.[0]?.expression
	if (expression?.type !== `TemplateLiteral`) {
		return false
	}
	if (expression.expressions?.length !== 0 || expression.quasis?.length !== 1) {
		return false
	}
	if (typeof value.value !== `string`) {
		return false
	}
	if (!value.value.startsWith(`\``) || !value.value.endsWith(`\``)) {
		return false
	}
	return true
}

function cookStaticTemplateLiteral(value: string): string {
	// oxlint-disable-next-line typescript/no-implied-eval
	return Function(`return ${value}`)() as string
}

export function preserveCodeBlockCodeProps(): (tree: unknown) => void {
	return (tree: unknown): void => {
		visit(tree, (node) => {
			if (node.type !== `mdxJsxFlowElement` || node.name !== `CodeBlock`) {
				return
			}
			if (!Array.isArray(node.attributes)) {
				return
			}
			for (const attribute of node.attributes as MdxAttribute[]) {
				if (attribute.type !== `mdxJsxAttribute` || attribute.name !== `code`) {
					continue
				}
				if (!hasStaticTemplateLiteral(attribute)) {
					continue
				}

				const code = cookStaticTemplateLiteral(attribute.value.value)
				const raw = JSON.stringify(code)
				attribute.value.value = raw
				attribute.value.data.estree.body[0].expression = {
					type: `Literal`,
					value: code,
					raw,
				}
			}
		})
	}
}
