import {
	usePullMutable,
	usePullMutableFamilyMember,
} from "atom.io/realtime-react"
import type { FC } from "react"

import {
	cardIndex,
	cardValuesIndex,
	deckIndices,
} from "~/apps/node/lodge/src/store/game"

import { findState } from "atom.io"
import { useO } from "atom.io/react"
import { h3 } from "../../containers/<hX>"
import { Controls } from "./Controls"
import { EnemyDomains } from "./EnemyDomains"
import scss from "./Game.module.scss"
import { MyDomain } from "./MyDomain"
import { Public } from "./Public"
import { myRoomState } from "./store/my-room"

interface GameProps {
	roomId: string
}
export const Game: FC<GameProps> = ({ roomId }) => {
	usePullMutable(cardIndex)
	usePullMutableFamilyMember(deckIndices(roomId))
	usePullMutable(cardValuesIndex)

	return (
		<div className={[`game`, scss.class].join(` `)}>
			<h3.wedge>Game</h3.wedge>
			<EnemyDomains />
			<Public />
			<Controls />
			<MyDomain />
		</div>
	)
}
