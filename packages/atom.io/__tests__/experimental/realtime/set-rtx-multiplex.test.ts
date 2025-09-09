import {
	atomFamily,
	editRelations,
	findRelations,
	getInternalRelations,
	getState,
	join,
	mutableAtom,
	mutableAtomFamily,
	selectorFamily,
	setState,
} from "atom.io"
import { IMPLICIT } from "atom.io/internal"
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

		const cardFacesAtoms = getInternalRelations(facesOfCards)
		const cardFacesPlayerViewAtoms = mutableAtomFamily<
			SetRTX<string>,
			[`player::${string}`, string]
		>({
			key: `cardFacesAliasAtoms`,
			class: SetRTX,
			effects: ([playerKey, faceKey]) => [
				({ setSelf }) => {
					const internal = getState(cardFacesAtoms, faceKey)
					internal.subject.subscribe(`?`, (update) => {
						const [type, ...rest] = update.split(`:`)
						const key = JSON.parse(rest.join(`:`))
						const visible = getState(visibleCardKeys, playerKey)

						console.log({ type, key, visible })

						if (visible.includes(key)) {
							setSelf((prev) => (prev.do(update), prev))
						}
					})
				},
			],
		})

		getState(cardFacesPlayerViewAtoms, [`player::alice`, `face::hearts-5`])
		getState(cardFacesPlayerViewAtoms, [`player::alice`, `card::aaa`])
		setState(cardKeysAtom, (keys) => keys.add(`card::aaa`))
		editRelations(stacksOfCards, (relations) => {
			relations.set(`stack-pile::deck-1`, `card::aaa`)
		})
		editRelations(facesOfCards, (relations) => {
			relations.set(`face::hearts-5`, `card::aaa`)
		})

		console.log(
			`alice 👁️ card::aaa`,
			new Set(
				IMPLICIT.STORE.valueMap.get(
					`cardFacesAliasAtoms(["player::alice","card::aaa"])`,
				),
			),
		)
		console.log(
			`alice 👁️ face::hearts-5`,
			new Set(
				IMPLICIT.STORE.valueMap.get(
					`cardFacesAliasAtoms(["player::alice","face::hearts-5"])`,
				),
			),
		)
	})
})
