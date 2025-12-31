import type {
	AtomToken,
	Loadable,
	ReadableToken,
	ReadonlyPureSelectorToken,
	RegularAtomToken,
} from "atom.io"
import {
	actUponStore,
	arbitrary,
	disposeFromStore,
	findInStore,
	getFromStore,
} from "atom.io/internal"
import type { FamilyNode, WritableTokenIndex } from "atom.io/introspection"
import { primitiveRefinery } from "atom.io/introspection"
import { useI, useO } from "atom.io/react"
import { type FC, useContext } from "react"

import { button } from "./Button"
import { DEFAULT_JSON_EDITOR_COMPONENTS } from "./json-editor"
import { StoreEditor } from "./StateEditor"
import { DevtoolsContext } from "./store"

/* eslint-disable no-console */

export const StateIndexLeafNode: FC<{
	node: ReadableToken<unknown, any, unknown>
	isOpenState: RegularAtomToken<boolean>
	typeState: ReadonlyPureSelectorToken<Loadable<string>>
	dispose?: (() => void) | undefined
}> = ({ node, isOpenState, typeState, dispose }) => {
	const { openCloseAllTX, store } = useContext(DevtoolsContext)

	const setIsOpen = useI(isOpenState)
	const isOpen = useO(isOpenState)

	const state = useO(node)
	const stateTypeLoadable = useO(typeState)
	const stateType =
		stateTypeLoadable instanceof Promise ? `Promise` : stateTypeLoadable

	const isPrimitive = Boolean(primitiveRefinery.refine(state))

	const path = node.family ? [node.family.key, node.family.subKey] : [node.key]

	let stringified: string
	try {
		stringified = JSON.stringify(state)
	} catch (_) {
		stringified = `?`
	}

	return (
		<>
			<header>
				<main
					onClick={() => {
						console.log(node, getFromStore(store, node))
					}}
					onKeyUp={() => {
						console.log(node, getFromStore(store, node))
					}}
				>
					<button.OpenClose
						isOpen={isOpen && !isPrimitive}
						testid={`open-close-state-${node.key}`}
						onShiftClick={() => {
							actUponStore(store, openCloseAllTX, arbitrary())(path, isOpen)
							return false
						}}
						setIsOpen={setIsOpen}
						disabled={isPrimitive}
					/>
					<h2>{node.family?.subKey ?? node.key}</h2>
					<span className="type detail">({stateType})</span>
				</main>
				<footer>
					{isPrimitive ? (
						<StoreEditor token={node} />
					) : (
						<div className="json_viewer">{stringified}</div>
					)}
					{dispose ? (
						<DEFAULT_JSON_EDITOR_COMPONENTS.Button
							onClick={() => {
								dispose?.()
							}}
							testid={`${node.key}-dispose`}
						>
							<DEFAULT_JSON_EDITOR_COMPONENTS.DeleteIcon />
						</DEFAULT_JSON_EDITOR_COMPONENTS.Button>
					) : null}
				</footer>
			</header>
			{isOpen && !isPrimitive ? (
				<main>
					<StoreEditor token={node} />
				</main>
			) : null}
		</>
	)
}
export const StateIndexTreeNode: FC<{
	node: FamilyNode<ReadableToken<unknown, any, unknown>>
	isOpenState: RegularAtomToken<boolean>
}> = ({ node, isOpenState }) => {
	const setIsOpen = useI(isOpenState)
	const isOpen = useO(isOpenState)

	const { typeSelectors, viewIsOpenAtoms, openCloseAllTX, store } =
		useContext(DevtoolsContext)

	for (const [key, childNode] of node.familyMembers) {
		findInStore(store, viewIsOpenAtoms, [key])
		findInStore(store, typeSelectors, childNode.key)
	}
	return (
		<>
			<header>
				<main>
					<button.OpenClose
						isOpen={isOpen}
						testid={`open-close-state-family-${node.key}`}
						onShiftClick={() => {
							actUponStore(
								store,
								openCloseAllTX,
								arbitrary(),
							)([node.key], isOpen)
							return false
						}}
						setIsOpen={setIsOpen}
					/>
					<h2>{node.key}</h2>
					<span className="type detail"> (family)</span>
				</main>
			</header>
			{isOpen
				? [...node.familyMembers.entries()].map(([key, childNode]) => (
						<StateIndexNode
							key={key}
							node={childNode}
							isOpenState={findInStore(store, viewIsOpenAtoms, [node.key, key])}
							typeState={findInStore(store, typeSelectors, childNode.key)}
							dispose={() => {
								disposeFromStore(store, childNode)
							}}
						/>
					))
				: null}
		</>
	)
}

export const StateIndexNode: FC<{
	node:
		| FamilyNode<ReadableToken<unknown, any, unknown>>
		| ReadableToken<unknown, any, unknown>
	isOpenState: RegularAtomToken<boolean>
	typeState: ReadonlyPureSelectorToken<Loadable<string>>
	dispose?: () => void
}> = ({ node, isOpenState, typeState, dispose }) => {
	return (
		<section className="node state" data-testid={`state-${node.key}`}>
			{`type` in node ? (
				<StateIndexLeafNode
					node={node}
					isOpenState={isOpenState}
					typeState={typeState}
					dispose={dispose}
				/>
			) : (
				<StateIndexTreeNode node={node} isOpenState={isOpenState} />
			)}
		</section>
	)
}

export const StateIndex: FC<{
	tokenIndex: AtomToken<WritableTokenIndex<ReadableToken<unknown, any, unknown>>>
}> = ({ tokenIndex }) => {
	const tokenIds = useO(tokenIndex)

	const { typeSelectors, viewIsOpenAtoms, store } = useContext(DevtoolsContext)
	const statesName = tokenIndex.key.includes(`Atom`) ? `atoms` : `selectors`

	return (
		<article className="index state_index" data-testid="state-index">
			{tokenIds.size === 0 ? (
				<p className="index-empty-state">(no {statesName})</p>
			) : (
				[...tokenIds.entries()].map(([key, node]) => {
					return (
						<StateIndexNode
							key={key}
							node={node}
							isOpenState={findInStore(store, viewIsOpenAtoms, [node.key])}
							typeState={findInStore(store, typeSelectors, node.key)}
						/>
					)
				})
			)}
		</article>
	)
}
