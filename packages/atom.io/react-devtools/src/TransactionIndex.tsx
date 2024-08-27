import type {
	ReadonlySelectorToken,
	RegularAtomToken,
	TransactionToken,
	TransactionUpdate,
} from "atom.io"
import { findState } from "atom.io/ephemeral"
import type { Func } from "atom.io/internal"
import { useI, useO } from "atom.io/react"
import type { FC } from "react"

import { button } from "./Button"
import {
	transactionIndex,
	transactionLogSelectors,
	viewIsOpenAtoms,
} from "./store"
import { article } from "./Updates"

export const TransactionLog: FC<{
	token: TransactionToken<Func>
	isOpenState: RegularAtomToken<boolean>
	logState: ReadonlySelectorToken<TransactionUpdate<Func>[]>
}> = ({ token, isOpenState, logState }) => {
	const log = useO(logState)
	const isOpen = useO(isOpenState)
	const setIsOpen = useI(isOpenState)

	return (
		<section
			className="node transaction_log"
			data-testid={`transaction-${token.key}`}
		>
			<header>
				<button.OpenClose
					isOpen={isOpen}
					testid={`open-close-transaction-${token.key}`}
					setIsOpen={setIsOpen}
				/>
				<label>
					<h2>{token.key}</h2>
					<span className="detail length">({log.length})</span>
				</label>
			</header>
			{isOpen ? (
				<main>
					{log.map((update, index) => (
						<article.TransactionUpdate
							key={update.key + index}
							serialNumber={index}
							transactionUpdate={update}
						/>
					))}
				</main>
			) : null}
		</section>
	)
}

export const TransactionIndex: FC = () => {
	const tokenIds = useO(transactionIndex)
	return (
		<article className="index transaction_index" data-testid="transaction-index">
			{tokenIds
				.filter((token) => !token.key.startsWith(`🔍`))
				.map((token) => {
					return (
						<TransactionLog
							key={token.key}
							token={token}
							isOpenState={findState(viewIsOpenAtoms, token.key)}
							logState={findState(transactionLogSelectors, token.key)}
						/>
					)
				})}
		</article>
	)
}
