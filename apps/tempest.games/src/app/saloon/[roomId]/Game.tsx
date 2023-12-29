"use client"

import {
	usePullFamilyMember,
	usePullMutable,
	usePullMutableFamilyMember,
} from "atom.io/realtime-react"

import {
	cardGroupIndex,
	cardIndex,
	cardValuesIndex,
	findCardGroupState,
} from "~/apps/node/lodge/src/store/game"

import { h3 } from "src/components/<hX>"
import { Controls } from "./Controls"
import { EnemyDomains } from "./EnemyDomains"
import { MyDomain } from "./MyDomain"
import { Public } from "./Public"

import { useJSON } from "atom.io/react"
import scss from "./Game.module.scss"

function CardGroupSync(props: { id: string }): null {
	usePullFamilyMember(findCardGroupState(props.id))
	return null
}
function CoreSync(): JSX.Element {
	const cardGroupIds = useJSON(cardGroupIndex)
	return (
		<>
			{cardGroupIds.members.map((id) => (
				<CardGroupSync key={id} id={id} />
			))}
		</>
	)
}

export function Game(): JSX.Element {
	usePullMutable(cardIndex)
	usePullMutable(cardGroupIndex)
	usePullMutable(cardValuesIndex)

	return (
		<div className={[`game`, scss.class].join(` `)}>
			<CoreSync />
			<h3.wedge>Game</h3.wedge>
			<Controls />
			<EnemyDomains />
			<Public />
			<MyDomain />
		</div>
	)
}
