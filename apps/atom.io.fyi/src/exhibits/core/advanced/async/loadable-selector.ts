import { atom, selector } from "atom.io"
import { Loadable } from "atom.io/internal"

function discoverCoinId() {
	const urlParams = new URLSearchParams(window.location.search)
	return urlParams.get(`coinId`) ?? `bitcoin`
}
export const coinIdState = atom<string>({
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

export const findCoinPriceState = selector<Loadable<number>>({
	key: `coinPrice`,
	get: async ({ get }) => {
		const coinId = get(coinIdState)
		const response = await fetch(
			`https://api.coingecko.com/api/v3/coins/${coinId}`,
		)
		const json = await response.json()
		return json.market_data.current_price.usd
	},
})
