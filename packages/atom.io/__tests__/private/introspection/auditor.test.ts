import { atomFamily, disposeState, findState, selectorFamily } from "atom.io"
import * as Internal from "atom.io/internal"
import { Auditor } from "atom.io/introspection"
import { Component } from "react"

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
})

describe(`Auditor unit tests`, () => {
	it(`lists resources from atom families`, () => {
		const auditor = new Auditor()
		const countAtoms = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		countAtoms(`foo`)
		const resources = auditor.listResources()
		expect(resources.length).toBe(1)
		expect(resources[0][0].key).toEqual(`count("foo")`)
	})
	it(`lists resources from selector families`, () => {
		const auditor = new Auditor()
		const countSelectors = selectorFamily<number, string>({
			key: `count`,
			get: () => () => 0,
		})
		countSelectors(`bar`)
		const resources = auditor.listResources()
		expect(resources.length).toBe(1)
		expect(resources[0][0].key).toEqual(`count("bar")`)
	})
})

describe(`Auditor practical tests`, () => {
	it(`helps you free up unused resources`, () => {
		const countAtoms = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		const doubleSelectors = selectorFamily<number, string>({
			key: `double`,
			get:
				(key) =>
				({ find, get }) =>
					get(find(countAtoms, key)) * 2,
		})
		findState(doubleSelectors, `foo`)
		const auditor = new Auditor()
		findState(doubleSelectors, `bar`)
		let resources = auditor.listResources()
		expect(resources.length).toBe(4)
		for (const [token, age] of resources) {
			disposeState(token)
		}
		resources = auditor.listResources()
		expect(resources.length).toBe(0)
    auditor[Symbol.dispose]()
    expect(auditor.listResources.bind(auditor)).toThrowError(`This Auditor has been disposed`)
	})
})