import path from "node:path"
import url from "node:url"

import type { TSD } from "../src"
import { compileDocs } from "../src"

const FILEPATH = url.fileURLToPath(import.meta.url)
const DIRNAME = path.dirname(FILEPATH)

beforeEach(async () => {})
afterEach(() => {})

async function testDocCompiler(
	name: string,
	expectation: (docs: TSD.Doc[]) => void,
) {
	const entrypoint = path.join(DIRNAME, `fixtures`, `src`, `${name}.ts`)
	const tsconfigPath = path.join(DIRNAME, `..`, `tsconfig.json`)
	const docs = compileDocs({ entrypoint, tsconfigPath })
	await Bun.write(
		path.join(DIRNAME, `fixtures`, `src`, `${name}.tsdoc.json`),
		JSON.stringify(docs, null, `\t`),
	)
	expectation(docs)
}

describe(`tsdoc.json`, () => {
	describe(`types`, () => {
		test(`atomic type declaration`, async () => {
			await testDocCompiler(`type--atomic`, ([doc]) => {
				expect(doc.type).toBe(`atomic`)
				expect(doc.name).toBe(`AtomicType`)
			})
		})
		test(`composite type declaration`, async () => {
			await testDocCompiler(`type--composite`, ([doc]) => {
				expect(doc.name).toBe(`CompositeType`)
				if (doc.type !== `composite`) {
					throw new Error(`Expected type to be composite`)
				}
				if (doc.kind !== `type`) {
					throw new Error(`Expected kind to be type`)
				}
				expect(doc.sections.length).toBe(1)
				expect(doc.modifierTags.length).toBe(1)
				expect(doc.blocks.length).toBe(0)
				expect(doc.properties.length).toBe(2)
				expect(doc.properties[0].name).toBe(`nestedCompositeType`)
				if (doc.properties[0].type !== `composite`) {
					throw new Error(`Expected type to be composite`)
				}
			})
		})
	})

	describe(`interfaces`, () => {
		test(`interface declaration`, async () => {
			await testDocCompiler(`interface`, ([doc]) => {
				expect(doc.name).toBe(`InterfaceDeclaration`)
				if (doc.type !== `composite`) {
					throw new Error(`Expected type to be composite`)
				}
				if (doc.kind !== `interface`) {
					throw new Error(`Expected kind to be interface`)
				}
				expect(doc.sections.length).toBe(1)
				expect(doc.modifierTags.length).toBe(1)
				expect(doc.blocks.length).toBe(0)
				expect(doc.properties.length).toBe(2)
				expect(doc.properties[0].name).toBe(`%CALL_SIGNATURE%`)
				expect(doc.properties[0].type).toBe(`function`)
				expect(doc.properties[1].name).toBe(`[Symbol.dispose]`)
				expect(doc.properties[1].type).toBe(`atomic`)
			})
		})
	})

	describe(`variables`, () => {
		test(`atomic variable declaration`, async () => {})
		test(`composite variable declaration`, async () => {})
	})

	describe(`classic functions`, () => {
		test(`regular function`, async () => {
			await testDocCompiler(`function--classic-regular`, ([doc]) => {
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
		test(`overloaded function`, async () => {
			await testDocCompiler(`function--classic-overloaded`, ([doc]) => {
				if (doc.type !== `function`) {
					throw new Error(`Expected type to be function`)
				}
				if (!(`overloads` in doc)) {
					throw new Error(`Expected overloads to be defined`)
				}
				expect(doc.overloads.length).toBe(2)
				expect(doc.name).toBe(`myFunction`)
				const overload0 = doc.overloads[0]
				expect(overload0.sections.length).toBe(1)
				expect(overload0.modifierTags.length).toBe(1)
				expect(overload0.blocks.length).toBe(2)

				expect(overload0.params.length).toBe(1)
				expect(overload0.params[0].name).toBe(`myParam`)
				expect(overload0.params[0].desc?.content[0].type).toBe(`plainText`)
			})
		})
	})

	describe(`class declarations`, () => {
		test(`atomic property declaration`, async () => {
			await testDocCompiler(`class--atomic-property-declaration`, ([doc]) => {
				expect(doc.name).toBe(`AtomicPropertyDeclaration`)
				if (doc.type !== `composite`) {
					throw new Error(`Expected type to be composite`)
				}
				if (doc.kind !== `class`) {
					throw new Error(`Expected kind to be class`)
				}
				expect(doc.sections.length).toBe(1)
				expect(doc.modifierTags.length).toBe(0)
				expect(doc.blocks.length).toBe(0)
				expect(doc.properties.length).toBe(1)
				expect(doc.properties[0].name).toBe(`hello`)
			})
		})
		test(`composite property declaration`, async () => {
			await testDocCompiler(`class--composite-property-declaration`, ([doc]) => {
				expect(doc.name).toBe(`CompositePropertyDeclaration`)
				if (doc.type !== `composite`) {
					throw new Error(`Expected type to be composite`)
				}
				if (doc.kind !== `class`) {
					throw new Error(`Expected kind to be class`)
				}
				expect(doc.sections.length).toBe(1)
				expect(doc.modifierTags.length).toBe(0)
				expect(doc.blocks.length).toBe(0)
				expect(doc.properties.length).toBe(1)
				expect(doc.properties[0].name).toBe(`compositeProperty`)
				if (doc.properties[0].type !== `composite`) {
					throw new Error(`Expected type to be composite`)
				}
				expect(doc.properties[0].properties.length).toBe(1)
				expect(doc.properties[0].properties[0].name).toBe(`deeperNested`)
			})
		})
		test(`method classic regular definition`, async () => {
			await testDocCompiler(
				`class--method-classic-regular-definition`,
				([doc]) => {
					expect(doc.name).toBe(`MethodClass`)
					if (doc.type !== `composite`) {
						throw new Error(`Expected type to be composite`)
					}
					if (doc.kind !== `class`) {
						throw new Error(`Expected kind to be class`)
					}
					expect(doc.sections.length).toBe(1)
					expect(doc.modifierTags.length).toBe(1)
					expect(doc.blocks.length).toBe(0)
					expect(doc.properties.length).toBe(1)
					expect(doc.properties[0].name).toBe(`method`)
				},
			)
		})
	})
})
