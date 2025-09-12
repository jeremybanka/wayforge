import { inspect } from "node:util"

import type { Logger, TransactionOutcomeEvent } from "atom.io"
import {
	editRelations,
	findRelations,
	findState,
	getInternalRelations,
	getState,
	join,
	mutableAtom,
	mutableAtomFamily,
	runTransaction,
	selectorFamily,
	setState,
	subscribe,
	transaction,
} from "atom.io"
import { IMPLICIT } from "atom.io/internal"
import * as Internal from "atom.io/internal"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import * as Utils from "../../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 3

let logger: Logger

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = Internal.IMPLICIT.STORE.logger //= Utils.createNullLogger()
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(Utils, `stdout`)
})

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
		const isCardKey = (key: string): key is `card::${string}` =>
			key.startsWith(`card::`)

		const cardFacesAtoms = getInternalRelations(facesOfCards)
		const cardFacesPlayerViewAtoms = mutableAtomFamily<
			SetRTX<string>,
			[`player::${string}`, `card::${string}` | `face::${string}`]
		>({
			key: `cardFacesAliasAtoms`,
			class: SetRTX,
			effects: ([playerKey, keyX]) => [
				({ setSelf }) => {
					console.log(`⛔⛔⛔⛔⛔⛔⛔ 0`, { keyX })
					const internal = getState(cardFacesAtoms, keyX)
					internal.subject.subscribe(`?`, (update) => {
						console.log(`⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔ 0`, { update })

						const [type, ...rest] = update.split(`:`)
						const keyY = JSON.parse(rest.join(`:`))
						const visible = getState(visibleCardKeys, playerKey)
						console.log({ faceKey: keyX, type, key: keyY, visible })

						if (isCardKey(keyX) && visible.includes(keyX)) {
							setSelf(
								(prev) => (prev.do(`${prev.cacheIdx + 1}=${update}`), prev),
							)
							return
						}

						if (visible.includes(keyY)) {
							console.log(`adding`, update)
							setSelf(
								(prev) => (prev.do(`${prev.cacheIdx + 1}=${update}`), prev),
							)
						}
					})
				},
				({ setSelf }) => {
					console.log(`⛔⛔⛔⛔⛔⛔⛔ 1`, { keyX })
					if (!isCardKey(keyX)) {
						subscribe(
							findState(visibleCardKeys, playerKey),
							({ newValue, oldValue }) => {
								console.log(`⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔ 1`, {
									newValue,
									oldValue,
								})

								setSelf((self) => {
									if (oldValue) {
										for (const previouslyVisibleCardKey of oldValue) {
											if (!newValue.includes(previouslyVisibleCardKey)) {
												self.delete(previouslyVisibleCardKey)
												setState(
													cardFacesPlayerViewAtoms,
													[playerKey, previouslyVisibleCardKey],
													(set) => (set.delete(keyX), set),
												)
											}
										}
									}
									for (const currentlyVisibleCardKey of newValue) {
										if (!self.has(currentlyVisibleCardKey)) {
											self.add(currentlyVisibleCardKey)
											setState(
												cardFacesPlayerViewAtoms,
												[playerKey, currentlyVisibleCardKey],
												(set) => (set.add(keyX), set),
											)
										}
									}
									return self
								})
							},
						)
					}
				},
			],
		})

		getState(cardFacesPlayerViewAtoms, [`player::alice`, `face::hearts-5`])
		getState(cardFacesPlayerViewAtoms, [`player::alice`, `card::44`])
		setState(cardKeysAtom, (keys) => keys.add(`card::44`))
		editRelations(stacksOfCards, (relations) => {
			relations.set(`stack-pile::1`, `card::44`)
		})
		editRelations(facesOfCards, (relations) => {
			relations.set(`face::hearts-5`, `card::44`)
		})

		console.log(
			`alice 👁️ card::44`,
			new Set(
				IMPLICIT.STORE.valueMap.get(
					`cardFacesAliasAtoms(["player::alice","card::44"])`,
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
		expect(
			new Set(getState(cardFacesPlayerViewAtoms, [`player::alice`, `card::44`])),
		).toEqual(new Set([`face::hearts-5`]))
		expect(
			new Set(
				getState(cardFacesPlayerViewAtoms, [`player::alice`, `face::hearts-5`]),
			),
		).toEqual(new Set([`card::44`]))

		setState(stackKeysAtom, (keys) => keys.add(`stack-deck::1`))

		editRelations(stacksOfCards, (relations) => {
			relations.set(`stack-deck::1`, `card::44`)
		})

		editRelations(facesOfCards, (relations) => {
			relations.set(`face::hearts-5`, `card::44`)
		})

		console.log(
			`alice 👁️ card::44`,
			new Set(
				IMPLICIT.STORE.valueMap.get(
					`cardFacesAliasAtoms(["player::alice","card::44"])`,
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
		expect(
			getState(cardFacesPlayerViewAtoms, [`player::alice`, `card::44`]),
		).toEqual(new SetRTX([]))
		expect(
			getState(cardFacesPlayerViewAtoms, [`player::alice`, `face::hearts-5`]),
		).toEqual(new SetRTX([]))
	})

	test.only(`translating a transaction update`, () => {
		const isCardKey = (key: string): key is `card::${string}` =>
			key.startsWith(`card::`)
		const isFaceKey = (key: string): key is `face::${string}` =>
			key.startsWith(`face::`)
		const isStackKey = (key: string): key is StackKey => key.startsWith(`stack-`)
		const isPlayerKey = (key: string): key is `player::${string}` =>
			key.startsWith(`player::`)

		const facesOfCards = join({
			key: `facesOfCards`,
			between: [`face`, `card`],
			cardinality: `1:n`,
			isAType: isFaceKey,
			isBType: isCardKey,
		})
		const stacksOfCards = join({
			key: `stacksOfCards`,
			between: [`stack`, `card`],
			cardinality: `1:n`,
			isAType: isStackKey,
			isBType: isCardKey,
		})
		const playersOwningStacks = join({
			key: `playersOwningStacks`,
			between: [`owner`, `stack`],
			cardinality: `1:n`,
			isAType: isPlayerKey,
			isBType: isStackKey,
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

		const transferCardTx = transaction<
			(cardKey: `card::${string}`, to: StackKey) => void
		>({
			key: `transferCard`,
			do: (_, cardKey, to) => {
				editRelations(stacksOfCards, (relations) => {
					relations.set(to, cardKey)
				})
			},
		})

		setState(cardKeysAtom, (keys) => keys.add(`card::44`))
		setState(stackKeysAtom, (keys) =>
			keys.add(`stack-pile::1`).add(`stack-deck::1`),
		)
		setState(faceKeysAtom, (keys) => keys.add(`face::hearts-5`))
		editRelations(stacksOfCards, (relations) => {
			relations.set(`stack-pile::1`, `card::44`)
		})
		editRelations(facesOfCards, (relations) => {
			relations.set(`face::hearts-5`, `card::44`)
		})
		let outcome: TransactionOutcomeEvent<typeof transferCardTx> | undefined

		subscribe(transferCardTx, (event) => {
			outcome = event
		})

		runTransaction(transferCardTx)(`card::44`, `stack-deck::1`)

		console.log(inspect(outcome, false, 10, true))
	})
})
