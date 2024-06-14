import path from "node:path"
import url from "node:url"

import { compileDocs } from "../src"

const FILEPATH = url.fileURLToPath(import.meta.url)
const DIRNAME = path.dirname(FILEPATH)

beforeEach(async () => {})
afterEach(() => {})

describe(`tsdoc.json`, () => {
	describe(`regular functions`, () => {
		it(`builds a doc for a regular function`, async () => {
			const entrypoint = path.join(
				DIRNAME,
				`fixtures`,
				`src`,
				`function--classic-regular.ts`,
			)
			const tsconfigPath = path.join(DIRNAME, `..`, `tsconfig.json`)
			const docs = compileDocs({ entrypoint, tsconfigPath })
			await Bun.write(
				path.join(
					DIRNAME,
					`fixtures`,
					`src`,
					`function--classic-regular.tsdoc.json`,
				),
				JSON.stringify(docs, null, `\t`),
			)
			const doc = docs[0]
			if (doc.type !== `function` || !(`params` in doc)) {
				throw new Error(`Expected type to be function`)
			}
			expect(doc.name).toBe(`myFunction`)
			expect(doc.sections.length).toBe(1)
			expect(doc.modifierTags.length).toBe(1)
			expect(doc.blocks.length).toBe(1)

			expect(doc.params.length).toBe(1)
			expect(doc.params[0].name).toBe(`myParam`)
			expect(doc.params[0].desc?.content[0].type).toBe(`plainText`)
		})
	})

	describe(`class declarations`, () => {
		test(`atomic property declaration`, async () => {
			const entrypoint = path.join(
				DIRNAME,
				`fixtures`,
				`src`,
				`class--atomic-property-declaration.ts`,
			)
			const tsconfigPath = path.join(DIRNAME, `..`, `tsconfig.json`)
			const docs = compileDocs({ entrypoint, tsconfigPath })
			await Bun.write(
				path.join(
					DIRNAME,
					`fixtures`,
					`src`,
					`class--atomic-property-declaration.tsdoc.json`,
				),
				JSON.stringify(docs, null, `\t`),
			)
			expect(docs[0].name).toBe(`AtomicPropertyDeclaration`)
			expect(docs[0].sections.length).toBe(1)
			expect(docs[0].modifierTags.length).toBe(0)
			expect(docs[0].blocks.length).toBe(0)
			if (docs[0].type !== `composite`) {
				throw new Error(`Expected type to be composite`)
			}
			if (docs[0].kind !== `class`) {
				throw new Error(`Expected kind to be class`)
			}
			expect(docs[0].properties.length).toBe(1)
			expect(docs[0].properties[0].name).toBe(`hello`)
		})
		test(`composite property declaration`, async () => {
			const entrypoint = path.join(
				DIRNAME,
				`fixtures`,
				`src`,
				`class--composite-property-declaration.ts`,
			)
			const tsconfigPath = path.join(DIRNAME, `..`, `tsconfig.json`)
			const docs = compileDocs({ entrypoint, tsconfigPath })
			await Bun.write(
				path.join(
					DIRNAME,
					`fixtures`,
					`src`,
					`class--composite-property-declaration.tsdoc.json`,
				),
				JSON.stringify(docs, null, `\t`),
			)
			expect(docs[0].name).toBe(`CompositePropertyDeclaration`)
			expect(docs[0].sections.length).toBe(1)
			expect(docs[0].modifierTags.length).toBe(0)
			expect(docs[0].blocks.length).toBe(0)
			if (docs[0].type !== `composite`) {
				throw new Error(`Expected type to be composite`)
			}
			if (docs[0].kind !== `class`) {
				throw new Error(`Expected kind to be class`)
			}
			expect(docs[0].properties.length).toBe(1)
			expect(docs[0].properties[0].name).toBe(`compositeProperty`)
			if (docs[0].properties[0].type !== `composite`) {
				throw new Error(`Expected type to be composite`)
			}
			expect(docs[0].properties[0].properties.length).toBe(1)
			expect(docs[0].properties[0].properties[0].name).toBe(`deeperNested`)
		})
		test(`method classic regular definition`, async () => {
			const entrypoint = path.join(
				DIRNAME,
				`fixtures`,
				`src`,
				`class--method-classic-regular-definition.ts`,
			)
			const tsconfigPath = path.join(DIRNAME, `..`, `tsconfig.json`)
			const docs = compileDocs({ entrypoint, tsconfigPath })
			await Bun.write(
				path.join(
					DIRNAME,
					`fixtures`,
					`src`,
					`class--method-classic-regular-definition.tsdoc.json`,
				),
				JSON.stringify(docs, null, `\t`),
			)
			expect(docs[0].name).toBe(`MethodClass`)
			expect(docs[0].sections.length).toBe(1)
			expect(docs[0].modifierTags.length).toBe(1)
			expect(docs[0].blocks.length).toBe(0)
			if (docs[0].type !== `composite`) {
				throw new Error(`Expected type to be composite`)
			}
			if (docs[0].kind !== `class`) {
				throw new Error(`Expected kind to be class`)
			}
			expect(docs[0].properties.length).toBe(1)
			expect(docs[0].properties[0].name).toBe(`method`)
		})
	})
})
