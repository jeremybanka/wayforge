import type {
	ReadonlySelectorToken,
	RegularAtomToken,
	WritableSelectorToken,
} from "atom.io"
import { findState, getState, selectorFamily } from "atom.io"
import type { FamilyNode, WritableTokenIndex } from "atom.io/introspection"
import { useI, useO } from "atom.io/react"
import type { FC } from "react"

import { recordToEntries } from "~/packages/anvl/src/object"
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
	node:
		| ReadonlySelectorToken<unknown>
		| RegularAtomToken<unknown>
		| WritableSelectorToken<unknown>
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
					setIsOpen={setIsOpen}
					disabled={isPrimitive}
				/>
				<label
					onClick={() => console.log(node, getState(node))}
					onKeyUp={() => console.log(node, getState(node))}
				>
					<h2>{node.family?.subKey ?? node.key}</h2>
					<span className="type detail">({stateType})</span>
				</label>
				{isPrimitive ? <StoreEditor token={node} /> : null}
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
	node: FamilyNode<
		| ReadonlySelectorToken<unknown>
		| RegularAtomToken<unknown>
		| WritableSelectorToken<unknown>
	>
	isOpenState: RegularAtomToken<boolean>
}> = ({ node, isOpenState }) => {
	const setIsOpen = useI(isOpenState)
	const isOpen = useO(isOpenState)
	for (const [key, childNode] of recordToEntries(node.familyMembers)) {
		findState(findViewIsOpenState, key)
		findState(findStateTypeState, childNode)
	}
	return (
		<>
			<header>
				<button.OpenClose isOpen={isOpen} setIsOpen={setIsOpen} />
				<label>
					<h2>{node.key}</h2>
					<span className="type detail"> (family)</span>
				</label>
			</header>
			{isOpen
				? Object.entries(node.familyMembers).map(([key, childNode]) => (
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
	node: WritableTokenIndex<
		| ReadonlySelectorToken<unknown>
		| RegularAtomToken<unknown>
		| WritableSelectorToken<unknown>
	>[string]
	isOpenState: RegularAtomToken<boolean>
	typeState: ReadonlySelectorToken<string>
}> = ({ node, isOpenState, typeState }) => {
	if (node.key.startsWith(`👁‍🗨`)) {
		return null
	}
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
	tokenIndex: ReadonlySelectorToken<
		WritableTokenIndex<
			| ReadonlySelectorToken<unknown>
			| RegularAtomToken<unknown>
			| WritableSelectorToken<unknown>
		>
	>
}> = ({ tokenIndex }) => {
	const tokenIds = useO(tokenIndex)
	return (
		<article className="index state_index" data-testid="state-index">
			{Object.entries(tokenIds)
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
