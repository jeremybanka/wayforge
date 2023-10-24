import { getState, setState } from "atom.io"
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
		setState(atoms.inventoryAmmoState, 42)
		expect(atoms.inventoryAmmoState.key).toEqual(`inventory.ammo`)
		expect(atoms.inventoryArmorState.key).toEqual(`inventory.armor`)
		expect(atoms.inventoryHealthState.key).toEqual(`inventory.health`)
		expect(selector.key).toEqual(`inventory`)
		expect(getState(selector)).toEqual({
			ammo: 42,
			health: 0,
			armor: 0,
		})
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
		setState(atomFamilies.findUserAgeState(`a`), 42)
		expect(atomFamilies.findUserAgeState.key).toEqual(`user.age`)
		expect(atomFamilies.findUserEmailState.key).toEqual(`user.email`)
		expect(atomFamilies.findUserNameState.key).toEqual(`user.name`)
		expect(selectorFamily.key).toEqual(`user`)
		expect(getState(selectorFamily(`a`))).toEqual({
			name: ``,
			age: 42,
			email: ``,
		})
	})
})
