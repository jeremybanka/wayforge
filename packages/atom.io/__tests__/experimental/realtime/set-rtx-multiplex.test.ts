import {
	atomFamily,
	findRelations,
	getInternalRelations,
	join,
	mutableAtom,
	selectorFamily,
} from "atom.io"
import { SetRTX } from "atom.io/transceivers/set-rtx"

describe(`join in perspective`, () => {
	test(`card game: players cannot see the values of cards private to other players or hidden from view`, () => {
		const facesOfCards = join({
			key: `facesOfCards`,
			between: [`face`, `card`],
			cardinality: `1:n`,
			isAType: (input): input is `face::${string}` => input.startsWith(`face::`),
			isBType: (input): input is `card::${string}` => input.startsWith(`card::`),
		})
		const stacksOfCards = join({
			key: `stacksOfCards`,
			between: [`stack`, `card`],
			cardinality: `1:n`,
			isAType: (input): input is StackKey => input.startsWith(`stack-`),
			isBType: (input): input is `card::${string}` => input.startsWith(`card::`),
		})
		const playersOwningStacks = join({
			key: `playersOwningStacks`,
			between: [`owner`, `stack`],
			cardinality: `1:n`,
			isAType: (input): input is `player::${string}` =>
				input.startsWith(`player::`),
			isBType: (input): input is StackKey => input.startsWith(`stack-`),
		})

		type StackType = `deck` | `hand` | `pile` | `trick`
		type StackKey = `stack-${StackType}::${string}`
		const stackType = (stackKey: StackKey): `stack-${StackType}` =>
			stackKey.split(`::`)[0] as any

		const playerKeysAtom = mutableAtom<SetRTX<`player::${string}`>>({
			key: `playerKeys`,
			class: SetRTX,
		})
		const stackKeysAtom = mutableAtom<SetRTX<`stack-${StackType}::${string}`>>({
			key: `stackKeys`,
			class: SetRTX,
		})
		const faceKeysAtom = mutableAtom<SetRTX<`face::${string}`>>({
			key: `faceKeys`,
			class: SetRTX,
		})
		const cardKeysAtom = mutableAtom<SetRTX<`card::${string}`>>({
			key: `cardKeys`,
			class: SetRTX,
		})

		const visibleCardKeys = selectorFamily<
			`card::${string}`[],
			`player::${string}`
		>({
			key: `visibleCardKeys`,
			get:
				(playerKey) =>
				({ get }) => {
					const visible: `card::${string}`[] = []
					const cardKeys = get(cardKeysAtom)
					for (const cardKey of cardKeys) {
						const stackKey = get(
							findRelations(stacksOfCards, cardKey).stackKeyOfCard,
						)
						if (!stackKey) continue
						switch (stackType(stackKey)) {
							case `stack-deck`:
								break
							case `stack-hand`:
								{
									const ownerKey = get(
										findRelations(playersOwningStacks, stackKey).ownerKeyOfStack,
									)
									if (ownerKey === playerKey) {
										visible.push(cardKey)
									}
								}
								break
							case `stack-pile`:
								visible.push(cardKey)
								break
							case `stack-trick`:
								visible.push(cardKey)
						}
					}
					return visible
				},
		})
	})
})
