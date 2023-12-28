import { usePullMutable } from "atom.io/realtime-react"
import type { FC } from "react"

import {
	cardGroupIndex,
	cardIndex,
	cardValuesIndex,
} from "~/apps/node/lodge/src/store/game"

import { h3 } from "../../containers/<hX>"
import { Controls } from "./Controls"
import { EnemyDomains } from "./EnemyDomains"
import scss from "./Game.module.scss"
import { MyDomain } from "./MyDomain"
import { Public } from "./Public"

export const Game: FC = () => {
	// usePullMutableFamily(groupsOfCards.findRelationsState__INTERNAL)
	// usePullMutableFamily(valuesOfCards.findRelationsState__INTERNAL)
	// usePullMutableFamily(ownersOfGroups.findRelationsState__INTERNAL)
	usePullMutable(cardIndex)
	usePullMutable(cardGroupIndex)
	usePullMutable(cardValuesIndex)

	// usePullFamily(findCardGroupState)

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
