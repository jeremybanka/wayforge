import type {
	ReadonlyPureSelectorToken,
	RegularAtomToken,
	TransactionOutcomeEvent,
	TransactionToken,
} from "atom.io"
import { findInStore, type Fn } from "atom.io/internal"
import { useI, useO } from "atom.io/react"
import { type FC, useContext } from "react"

import { button } from "./Button"
import { DevtoolsContext } from "./store"
import { article } from "./Updates"

export const TransactionLog: FC<{
	token: TransactionToken<Fn>
	isOpenState: RegularAtomToken<boolean>
	logState: ReadonlyPureSelectorToken<
		readonly TransactionOutcomeEvent<TransactionToken<Fn>>[]
	>
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
				<main>
					<button.OpenClose
						isOpen={isOpen}
						testid={`open-close-transaction-${token.key}`}
						setIsOpen={setIsOpen}
					/>
					<h2>{token.key}</h2>
				</main>
				<span className="detail length">({log.length})</span>
			</header>
			{isOpen ? (
				<main>
					{log.map((update, index) => (
						<article.TransactionUpdate
							key={update.token.key + index}
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
	const { transactionIndex, transactionLogSelectors, viewIsOpenAtoms, store } =
		useContext(DevtoolsContext)

	const tokenIds = useO(transactionIndex)
	return (
		<article className="index transaction_index" data-testid="transaction-index">
			{tokenIds.length === 0 ? (
				<p className="index-empty-state">(no transactions)</p>
			) : (
				tokenIds
					.filter((token) => !token.key.startsWith(`🔍`))
					.map((token) => {
						return (
							<TransactionLog
								key={token.key}
								token={token}
								isOpenState={findInStore(store, viewIsOpenAtoms, [token.key])}
								logState={findInStore(store, transactionLogSelectors, token.key)}
							/>
						)
					})
			)}
		</article>
	)
}
