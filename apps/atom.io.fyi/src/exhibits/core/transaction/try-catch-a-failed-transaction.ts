import { atom, atomFamily, runTransaction, transaction } from "atom.io"
import { Loadable } from "atom.io/internal"

export type GameItems = { coins: number }
export type Inventory = Partial<Readonly<GameItems>>

export const myIdState = atom<Loadable<string>>({
	key: `myId`,
	default: async () => {
		const response = await fetch(`https://io.fyi/api/myId`)
		const { id } = await response.json()
		return id
	},
})

export const findPlayerInventoryState = atomFamily<Inventory, string>({
	key: `inventory`,
	default: {},
})

export const giveCoinsTX = transaction<
	(playerId: string, amount: number) => Promise<void>
>({
	key: `giveCoins`,
	do: async ({ get, set }, playerId, amount) => {
		const myId = await get(myIdState)
		const myInventoryState = findPlayerInventoryState(myId)
		const myInventory = get(myInventoryState)
		if (!myInventory.coins) {
			throw new Error(`Your inventory is missing coins`)
		}
		const myCoins = myInventory.coins
		if (myCoins < amount) {
			throw new Error(`You don't have enough coins`)
		}
		const theirInventoryState = findPlayerInventoryState(playerId)
		const theirInventory = get(theirInventoryState)
		const theirCoins = theirInventory.coins || 0
		set(findPlayerInventoryState(myId), { coins: myCoins - amount })
	},
})
;async () => {
	try {
		await runTransaction(giveCoinsTX)(`playerId`, 3)
	} catch (thrown) {
		if (thrown instanceof Error) {
			alert(thrown.message)
		}
	}
}
