import type {
	Loadable,
	ReadableToken,
	ReadonlyPureSelectorToken,
	RegularAtomToken,
} from "atom.io"
import { getState } from "atom.io"
import { findInStore } from "atom.io/internal"
import type { FamilyNode, WritableTokenIndex } from "atom.io/introspection"
import { primitiveRefinery } from "atom.io/introspection"
import { useI, useO } from "atom.io/react"
import { type FC, useContext } from "react"

import { button } from "./Button"
import { StoreEditor } from "./StateEditor"
import { DevtoolsContext } from "./store"

/* eslint-disable no-console */

export const StateIndexLeafNode: FC<{
	node: ReadableToken<unknown>
	isOpenState: RegularAtomToken<boolean>
	typeState: ReadonlyPureSelectorToken<Loadable<string>>
}> = ({ node, isOpenState, typeState }) => {
	const setIsOpen = useI(isOpenState)
	const isOpen = useO(isOpenState)

	const state = useO(node)
	const stateTypeLoadable = useO(typeState)
	const stateType =
		stateTypeLoadable instanceof Promise ? `Promise` : stateTypeLoadable

	const isPrimitive = Boolean(primitiveRefinery.refine(state))

	return (
		<>
			<header>
				<main
					onClick={() => {
						console.log(node, getState(node))
					}}
					onKeyUp={() => {
						console.log(node, getState(node))
					}}
				>
					<button.OpenClose
						isOpen={isOpen && !isPrimitive}
						testid={`open-close-state-${node.key}`}
						setIsOpen={setIsOpen}
						disabled={isPrimitive}
					/>
					<h2>{node.family?.subKey ?? node.key}</h2>
					<span className="type detail">({stateType})</span>
				</main>
				{isPrimitive ? (
					<StoreEditor token={node} />
				) : (
					<div className="json_viewer">{JSON.stringify(state)}</div>
				)}
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
	node: FamilyNode<ReadableToken<unknown>>
	isOpenState: RegularAtomToken<boolean>
}> = ({ node, isOpenState }) => {
	const setIsOpen = useI(isOpenState)
	const isOpen = useO(isOpenState)

	const { typeSelectors, viewIsOpenAtoms, store } = useContext(DevtoolsContext)

	for (const [key, childNode] of node.familyMembers) {
		findInStore(store, viewIsOpenAtoms, key)
		findInStore(store, typeSelectors, childNode.key)
	}
	return (
		<>
			<header>
				<main>
					<button.OpenClose
						isOpen={isOpen}
						testid={`open-close-state-family-${node.key}`}
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
							isOpenState={findInStore(store, viewIsOpenAtoms, childNode.key)}
							typeState={findInStore(store, typeSelectors, childNode.key)}
						/>
					))
				: null}
		</>
	)
}

export const StateIndexNode: FC<{
	node: FamilyNode<ReadableToken<unknown>> | ReadableToken<unknown>
	isOpenState: RegularAtomToken<boolean>
	typeState: ReadonlyPureSelectorToken<Loadable<string>>
}> = ({ node, isOpenState, typeState }) => {
	return (
		<section className="node state" data-testid={`state-${node.key}`}>
			{`type` in node ? (
				<StateIndexLeafNode
					node={node}
					isOpenState={isOpenState}
					typeState={typeState}
				/>
			) : (
				<StateIndexTreeNode node={node} isOpenState={isOpenState} />
			)}
		</section>
	)
}

export const StateIndex: FC<{
	tokenIndex: ReadonlyPureSelectorToken<
		WritableTokenIndex<ReadableToken<unknown>>
	>
}> = ({ tokenIndex }) => {
	const tokenIds = useO(tokenIndex)

	const { typeSelectors, viewIsOpenAtoms, store } = useContext(DevtoolsContext)

	console.log(tokenIds)
	return (
		<article className="index state_index" data-testid="state-index">
			{[...tokenIds.entries()].map(([key, node]) => {
				return (
					<StateIndexNode
						key={key}
						node={node}
						isOpenState={findInStore(store, viewIsOpenAtoms, node.key)}
						typeState={findInStore(store, typeSelectors, node.key)}
					/>
				)
			})}
		</article>
	)
}
