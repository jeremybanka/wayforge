import type {
	AtomToken,
	ReadonlySelectorToken,
	TransactionToken,
	TransactionUpdate,
} from "atom.io"
import { useIO, useO } from "atom.io/react"
import type { FC } from "react"

import type { ƒn } from "~/packages/anvl/src/function"

import {
	findTransactionLogState,
	findViewIsOpenState,
	prettyJson,
	transactionIndex,
} from "."

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
				<button
					type="button"
					className={isOpen ? `open` : `closed`}
					onClick={() => setIsOpen((isOpen) => !isOpen)}
				>
					▶
				</button>
				<label>
					<h3>{token.key}</h3>
					<span className="detail length">({log.length})</span>
				</label>
			</header>
			{isOpen ? (
				<main>
					{log.map((update, index) => {
						return (
							<div key={update.key + index} className="transaction_update">
								<header>
									<h4>{index}</h4>
								</header>
								<main>
									<section className="transaction_io">
										<div className="transaction_params">
											<span className="output_name">params: </span>
											{update.params.map((param, index) => {
												return (
													<div
														key={`param` + index}
														className="transaction_param"
													>
														<span className="param_name">{param.name}</span>
														<span className="param_value">
															{JSON.stringify(param.value)}
														</span>
													</div>
												)
											})}
										</div>
										<div className="transaction_output">
											<span className="output_name">output: </span>
											<span className="output_value">
												{JSON.stringify(update.output)}
											</span>
										</div>
									</section>
									<section className="transaction_impact">
										{update.atomUpdates
											.filter((token) => !token.key.startsWith(`👁‍🗨`))
											.map((atomUpdate) => {
												return (
													<div
														key={atomUpdate.key}
														className="atom_update"
														onClick={() => console.log(atomUpdate)}
														onKeyUp={() => console.log(atomUpdate)}
													>
														<span>{atomUpdate.key}: </span>
														<span>
															<span className="summary">
																{
																	prettyJson.diff(
																		atomUpdate.oldValue,
																		atomUpdate.newValue,
																	).summary
																}
															</span>
														</span>
													</div>
												)
											})}
									</section>
								</main>
							</div>
						)
					})}
				</main>
			) : null}
		</section>
	)
}

export const TransactionIndex: FC = () => {
	const tokenIds = useO(transactionIndex)
	return (
		<article className="index transaction_index">
			<h2>transactions</h2>
			<main>
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
			</main>
		</article>
	)
}
