import { usePull, usePullFamily } from "atom.io/realtime-react"
import type { FC } from "react"

import {
	cardGroupIndexJSON,
	cardIndexJSON,
	cardValuesIndexJSON,
	findCardGroupState,
	groupsOfCardsStateJSON,
	ownersOfGroupsStateJSON,
	valuesOfCardsStateJSON,
} from "~/apps/node/lodge/src/store/game"

import { Controls } from "./Controls"
import { EnemyDomains } from "./EnemyDomains"
import scss from "./Game.module.scss"
import { MyDomain } from "./MyDomain"
import { Public } from "./Public"
import { h3 } from "../../containers/<hX>"

export const Game: FC = () => {
	usePull(ownersOfGroupsStateJSON)
	usePull(valuesOfCardsStateJSON)
	usePull(groupsOfCardsStateJSON)
	usePull(cardIndexJSON)
	usePull(cardGroupIndexJSON)
	usePull(cardValuesIndexJSON)

	usePullFamily(findCardGroupState)

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
