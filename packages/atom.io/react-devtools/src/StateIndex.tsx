import type {
	ReadableToken,
	ReadonlySelectorToken,
	RegularAtomToken,
} from "atom.io"
import { getState, selectorFamily } from "atom.io"
import { findState } from "atom.io/ephemeral"
import type { FamilyNode, WritableTokenIndex } from "atom.io/introspection"
import { useI, useO } from "atom.io/react"
import type { FC } from "react"

import { isJson, refineJsonType } from "~/packages/anvl/src/refinement"

import { findViewIsOpenState, primitiveRefinery } from "."
import { button } from "./Button"
import { StoreEditor } from "./StateEditor"

const findStateTypeState = selectorFamily<string, { key: string }>({
	key: `👁‍🗨 State Type`,
	get:
		(token) =>
		({ get }) => {
			let state: unknown
			try {
				state = get(token as any)
			} catch (error) {
				return `error`
			}
			if (state === undefined) return `undefined`
			if (isJson(state)) return refineJsonType(state).type
			return Object.getPrototypeOf(state).constructor.name
		},
})

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
		findState(findViewIsOpenState, key)
		findState(findStateTypeState, childNode)
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
							isOpenState={findState(findViewIsOpenState, childNode.key)}
							typeState={findState(findStateTypeState, childNode)}
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
							isOpenState={findState(findViewIsOpenState, node.key)}
							typeState={findState(findStateTypeState, node)}
						/>
					)
				})}
		</article>
	)
}
