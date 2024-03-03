import { findState, getState, setState } from "atom.io"
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
		const [piecemealStates, clusterStates] = structFamily({
			key: `user`,
			default: {
				name: ``,
				age: 0,
				email: ``,
			},
		})
		setState(piecemealStates.findUserAgeState(`a`), 42)
		expect(piecemealStates.findUserAgeState.key).toEqual(`user.age`)
		expect(piecemealStates.findUserEmailState.key).toEqual(`user.email`)
		expect(piecemealStates.findUserNameState.key).toEqual(`user.name`)
		expect(clusterStates.key).toEqual(`user`)
		const aClusterState = findState(clusterStates, `a`)
		expect(getState(aClusterState)).toEqual({
			name: ``,
			age: 42,
			email: ``,
		})
	})
})
