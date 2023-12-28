"use client"

import { usePullMutable } from "atom.io/realtime-react"

import {
	cardGroupIndex,
	cardIndex,
	cardValuesIndex,
} from "~/apps/node/lodge/src/store/game"

import { h3 } from "src/components/<hX>"
import { Controls } from "./Controls"
import { EnemyDomains } from "./EnemyDomains"
import { MyDomain } from "./MyDomain"
import { Public } from "./Public"

import scss from "./Game.module.scss"

export function Game(): JSX.Element {
	usePullMutable(cardIndex)
	usePullMutable(cardGroupIndex)
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
