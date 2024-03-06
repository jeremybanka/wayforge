import {
	type ReadonlySelectorToken,
	type RegularAtomToken,
	type TransactionToken,
	type TransactionUpdate,
	findState,
	type ƒn,
} from "atom.io"
import { useI, useO } from "atom.io/react"
import type { FC } from "react"

import {
	findTransactionLogState,
	findViewIsOpenState,
	transactionIndex,
} from "."
import { button } from "./Button"
import { article } from "./Updates"

export const TransactionLog: FC<{
	token: TransactionToken<ƒn>
	isOpenState: RegularAtomToken<boolean>
	logState: ReadonlySelectorToken<TransactionUpdate<ƒn>[]>
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
				.filter((token) => !token.key.startsWith(`👁‍🗨`))
				.map((token) => {
					return (
						<TransactionLog
							key={token.key}
							token={token}
							isOpenState={findState(findViewIsOpenState, token.key)}
							logState={findState(findTransactionLogState, token.key)}
						/>
					)
				})}
		</article>
	)
}
