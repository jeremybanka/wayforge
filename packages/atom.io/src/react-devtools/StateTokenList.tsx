import type { AtomToken, ReadonlySelectorToken, SelectorToken } from "atom.io"
import { atomFamily, getState, selectorFamily } from "atom.io"
import { useO, useIO } from "atom.io/react"
import { motion } from "framer-motion"
import type { FC } from "react"

import { isJson, refineJsonType } from "~/packages/anvl/src/json"
import { recordToEntries } from "~/packages/anvl/src/object"

import { StoreEditor } from "./StateEditor"
import type { FamilyNode, StateTokenIndex } from "../introspection"

export const findStateViewIsOpenState = atomFamily<boolean, string>({
	key: `👁‍🗨 State View Is Open`,
	default: false,
})

export const findStateTypeState = selectorFamily<string, { key: string }>({
	key: `👁‍🗨 State Type`,
	get: (token) => ({ get }) => {
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

export const TokenListFamilyNode: FC<{
	node: FamilyNode<
		AtomToken<unknown> | ReadonlySelectorToken<unknown> | SelectorToken<unknown>
	>
	isOpenState: AtomToken<boolean>
}> = ({ node, isOpenState }) => {
	const [isOpen, setIsOpen] = useIO(isOpenState)
	Object.entries(node.familyMembers).forEach(([key, childNode]) => {
		findStateViewIsOpenState(key)
		findStateTypeState(childNode)
	})
	return (
		<>
			<header>
				<button
					type="button"
					className={isOpen ? `open` : `closed`}
					onClick={() => setIsOpen((isOpen) => !isOpen)}
				>
					▶
				</button>
				<label>
					{node.key}
					<span className="type"> (family)</span>
				</label>
			</header>
			{isOpen
				? Object.entries(node.familyMembers).map(([key, childNode]) => (
						<TokenListNode
							key={key}
							node={childNode}
							isOpenState={findStateViewIsOpenState(childNode.key)}
							typeState={findStateTypeState(childNode)}
						/>
				  ))
				: null}
		</>
	)
}

export const TokenListNode: FC<{
	node: StateTokenIndex<
		AtomToken<unknown> | ReadonlySelectorToken<unknown> | SelectorToken<unknown>
	>[string]
	isOpenState: AtomToken<boolean>
	typeState: ReadonlySelectorToken<string>
}> = ({ node, isOpenState, typeState }) => {
	console.log(node)
	const [isOpen, setIsOpen] = useIO(isOpenState)
	const stateType = useO(typeState)
	return node.key.startsWith(`👁‍🗨`) ? null : (
		<div className="node">
			{`type` in node ? (
				<>
					<header>
						<button
							type="button"
							className={isOpen ? `open` : `closed`}
							onClick={() => setIsOpen((isOpen) => !isOpen)}
						>
							▶
						</button>
						<label
							onClick={() => console.log(node, getState(node))}
							onKeyUp={() => console.log(node, getState(node))}
						>
							{node.key}
							<span className="type"> ({stateType})</span>
						</label>
					</header>
					{isOpen ? (
						<main>
							<StoreEditor token={node} />
						</main>
					) : null}
				</>
			) : (
				<TokenListFamilyNode node={node} isOpenState={isOpenState} />
			)}
		</div>
	)
}

export const TokenList: FC<{
	groupTitle: string
	tokenIndex: ReadonlySelectorToken<
		StateTokenIndex<
			| AtomToken<unknown>
			| ReadonlySelectorToken<unknown>
			| SelectorToken<unknown>
		>
	>
}> = ({ groupTitle, tokenIndex }) => {
	const tokenIds = useO(tokenIndex)
	return (
		<section>
			<h2>{groupTitle}</h2>
			<main>
				{Object.entries(tokenIds).map(([key, node]) => {
					return (
						<TokenListNode
							key={key}
							node={node}
							isOpenState={findStateViewIsOpenState(node.key)}
							typeState={findStateTypeState(node)}
						/>
					)
				})}
			</main>
		</section>
	)
}
