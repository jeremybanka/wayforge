import type {
	AtomToken,
	ReadonlySelectorToken,
	TransactionToken,
	TransactionUpdate,
	ƒn,
} from "atom.io"
import { useIO, useO } from "atom.io/react"
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
	isOpenState: AtomToken<boolean>
	logState: ReadonlySelectorToken<TransactionUpdate<ƒn>[]>
}> = ({ token, isOpenState, logState }) => {
	const log = useO(logState)
	const [isOpen, setIsOpen] = useIO(isOpenState)

	return (
		<section className="node transaction_log">
			<header>
				<button.OpenClose isOpen={isOpen} setIsOpen={setIsOpen} />
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
		<article className="index transaction_index">
			{tokenIds
				.filter((token) => !token.key.startsWith(`👁‍🗨`))
				.map((token) => {
					return (
						<TransactionLog
							key={token.key}
							token={token}
							isOpenState={findViewIsOpenState(token.key)}
							logState={findTransactionLogState(token.key)}
						/>
					)
				})}
		</article>
	)
}
