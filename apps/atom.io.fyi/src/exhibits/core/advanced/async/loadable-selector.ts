import type { Loadable } from "atom.io"
import { atom, selector } from "atom.io"

function discoverCoinId() {
	const urlParams = new URLSearchParams(window.location.search)
	return urlParams.get(`coinId`) ?? `bitcoin`
}
export const coinIdAtom = atom<string>({
	key: `coinId`,
	default: discoverCoinId,
	effects: [
		({ setSelf }) => {
			window.addEventListener(`popstate`, () => {
				setSelf(discoverCoinId())
			})
		},
	],
})

export const coinPriceSelector = selector<Loadable<number>>({
	key: `coinPrice`,
	get: async ({ get }) => {
		const coinId = get(coinIdAtom)
		const response = await fetch(
			`https://api.coingecko.com/api/v3/coins/${coinId}`,
		)
		const json = await response.json()
		return json.market_data.current_price.usd
	},
})
