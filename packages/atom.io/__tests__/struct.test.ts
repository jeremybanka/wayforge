import { struct, structFamily } from "atom.io/data"

describe(`struct`, () => {
	it(`breaks a flat object structure into separate atoms`, () => {
		const [atoms, selector] = struct({
			key: `inventory`,
			default: {
				ammo: 0,
				health: 0,
				armor: 0,
			},
		})
		expect(Object.keys(atoms)).toEqual([
			`inventoryAmmoState`,
			`inventoryHealthState`,
			`inventoryArmorState`,
		])
		expect(selector.key).toEqual(`inventory`)
	})
})

describe(`structFamily`, () => {
	it(`breaks a flat object structure into separate atoms (family-style)`, () => {
		const [atomFamilies, selectorFamily] = structFamily({
			key: `user`,
			default: {
				name: ``,
				age: 0,
				email: ``,
			},
		})
		expect(Object.keys(atomFamilies)).toEqual([
			`findUserNameState`,
			`findUserAgeState`,
			`findUserEmailState`,
		])
		expect(selectorFamily.key).toEqual(`user`)
	})
})
