"use client"

import { useJSON } from "atom.io/react"
import { usePullFamilyMember, usePullMutable } from "atom.io/realtime-react"

import {
	cardGroupIndex,
	cardIndex,
	cardValuesIndex,
	findCardGroupState,
} from "~/apps/node/lodge/src/store/game"

import { Controls } from "./__devtools__/Controls"
import { MyDomain } from "./my-domain/MyDomain"
import { EnemyDomains } from "./other-players/EnemyDomains"
import { Public } from "./public/Public"

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
		<>
			<CoreSync />
			<div className={scss.class}>
				{/* <Controls /> */}
				<section data-css="enemy-domains">
					<EnemyDomains />
				</section>
				<section data-css="public">
					<Public />
				</section>
				<section data-css="my-domain">
					<MyDomain />
				</section>
			</div>
		</>
	)
}
