"use client"

import type { LoggerIcon, TokenDenomination } from "atom.io"
import { AtomIOLogger, findState } from "atom.io"
import { IMPLICIT } from "atom.io/internal"
import { useJSON } from "atom.io/react"
import { usePullAtomFamilyMember, usePullMutable } from "atom.io/realtime-react"

import {
	cardIndex,
	cardValuesIndex,
	deckAtoms,
	deckIndex,
	handAtoms,
	handIndex,
	trickIndex,
	trickStates,
} from "~/apps/node/lodge/src/store/game"

import { MyDomain } from "./my-domain/MyDomain"
import { EnemyDomains } from "./other-players/EnemyDomains"
import { Public } from "./public/Public"

import scss from "./Game.module.scss"

IMPLICIT.STORE.loggers[0] = new AtomIOLogger(
	`info`,
	(icon, tokenType, tokenKey, message) => {
		const allowedIcons: LoggerIcon[] = [`🛄`]
		const ignoredTokenTypes: TokenDenomination[] = []
		const ignoredTokens = [`actions`, `radialMode`, `windowMousePosition`]
		const ignoredMessageContents: string[] = []
		if (!allowedIcons.includes(icon)) return false
		if (ignoredTokenTypes.includes(tokenType)) return false
		if (ignoredTokens.includes(tokenKey)) return false
		for (const ignoredMessageContent of ignoredMessageContents) {
			if (message.includes(ignoredMessageContent)) return false
		}
		return true
	},
)

function DeckSync(props: { id: string }): null {
	usePullAtomFamilyMember(deckAtoms, props.id)
	return null
}
function HandSync(props: { id: string }): null {
	usePullAtomFamilyMember(handAtoms, props.id)
	return null
}
function TrickSync(props: { id: string }): null {
	usePullAtomFamilyMember(trickStates, props.id)
	return null
}
function CoreSync(): JSX.Element {
	const deckIds = useJSON(deckIndex)
	const handIds = useJSON(handIndex)
	const trickIds = useJSON(trickIndex)
	return (
		<>
			{deckIds.members.map((id) => (
				<DeckSync key={id} id={id} />
			))}
			{handIds.members.map((id) => (
				<HandSync key={id} id={id} />
			))}
			{trickIds.members.map((id) => (
				<TrickSync key={id} id={id} />
			))}
		</>
	)
}

export type GameProps = {
	roomId: string
}
export function Game({ roomId }: GameProps): JSX.Element {
	usePullMutable(cardIndex)
	usePullMutable(deckIndex)
	usePullMutable(handIndex)
	usePullMutable(trickIndex)
	usePullMutable(cardValuesIndex)

	return (
		<>
			<CoreSync />
			<div className={scss.class}>
				{/* <Controls /> */}
				<section data-css="enemy-domains">
					<EnemyDomains />
				</section>
				<section data-css="public">
					<Public roomId={roomId} />
				</section>
				<section data-css="my-domain">
					<MyDomain />
				</section>
			</div>
		</>
	)
}
