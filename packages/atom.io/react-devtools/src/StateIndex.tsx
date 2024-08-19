import type {
	ReadableToken,
	ReadonlySelectorToken,
	RegularAtomToken,
} from "atom.io"
import { getState, selectorFamily } from "atom.io"
import { findState } from "atom.io/ephemeral"
import type { FamilyNode, WritableTokenIndex } from "atom.io/introspection"
import { primitiveRefinery } from "atom.io/introspection"
import type { Canonical } from "atom.io/json"
import { useI, useO } from "atom.io/react"
import type { FC } from "react"

import { button } from "./Button"
import { StoreEditor } from "./StateEditor"
import { typeSelectors, viewIsOpenAtoms } from "./store"

export const StateIndexLeafNode: FC<{
	node: ReadableToken<unknown>
	isOpenState: RegularAtomToken<boolean>
	typeState: ReadonlySelectorToken<string>
}> = ({ node, isOpenState, typeState }) => {
	const setIsOpen = useI(isOpenState)
	const isOpen = useO(isOpenState)

	const state = useO(node)
	const stateType = useO(typeState)

	const isPrimitive = Boolean(primitiveRefinery.refine(state))

	return (
		<>
			<header>
				<button.OpenClose
					isOpen={isOpen && !isPrimitive}
					testid={`open-close-state-${node.key}`}
					setIsOpen={setIsOpen}
					disabled={isPrimitive}
				/>
				<label
					onClick={() => {
						console.log(node, getState(node))
					}}
					onKeyUp={() => {
						console.log(node, getState(node))
					}}
				>
					<h2>{node.family?.subKey ?? node.key}</h2>
					<span className="type detail">({stateType})</span>
				</label>
				<StoreEditor token={node} />
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
	for (const [key, childNode] of node.familyMembers) {
		findState(viewIsOpenAtoms, key)
		findState(typeSelectors, childNode.key)
	}
	return (
		<>
			<header>
				<button.OpenClose
					isOpen={isOpen}
					testid={`open-close-state-family-${node.key}`}
					setIsOpen={setIsOpen}
				/>
				<label>
					<h2>{node.key}</h2>
					<span className="type detail"> (family)</span>
				</label>
			</header>
			{isOpen
				? [...node.familyMembers.entries()].map(([key, childNode]) => (
						<StateIndexNode
							key={key}
							node={childNode}
							isOpenState={findState(viewIsOpenAtoms, childNode.key)}
							typeState={findState(typeSelectors, childNode.key)}
						/>
					))
				: null}
		</>
	)
}

export const StateIndexNode: FC<{
	node: FamilyNode<ReadableToken<unknown>> | ReadableToken<unknown>
	isOpenState: RegularAtomToken<boolean>
	typeState: ReadonlySelectorToken<string>
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
	tokenIndex: ReadonlySelectorToken<WritableTokenIndex<ReadableToken<unknown>>>
}> = ({ tokenIndex }) => {
	const tokenIds = useO(tokenIndex)
	return (
		<article className="index state_index" data-testid="state-index">
			{[...tokenIds.entries()]
				.filter(([key]) => !key.startsWith(`👁‍🗨`))
				.sort()
				.map(([key, node]) => {
					return (
						<StateIndexNode
							key={key}
							node={node}
							isOpenState={findState(viewIsOpenAtoms, node.key)}
							typeState={findState(typeSelectors, node.key)}
						/>
					)
				})}
		</article>
	)
}
