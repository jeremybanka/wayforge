import type {
	ReadonlySelectorToken,
	TransactionToken,
	TransactionUpdate,
} from "atom.io"
import { useO } from "atom.io/react"
import type { FC } from "react"

import type { ƒn } from "~/packages/anvl/src/function"

import { findTransactionLogState, transactionIndex } from "."

export const TransactionLog: FC<{
	token: TransactionToken<ƒn>
	logState: ReadonlySelectorToken<TransactionUpdate<ƒn>[]>
}> = ({ token, logState }) => {
	const log = useO(logState)
	return (
		<section className="transaction_log">
			<h3>{token.key}</h3>
			<main>
				{log.map((update, index) => {
					return (
						<div key={update.key + index} className="transaction_update">
							<h4>{index}</h4>
							<section className="transaction_io">
								<div className="transaction_params">
									{update.params.map((param, index) => {
										return (
											<div key={index} className="transaction_param">
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
													<span className="value old_value">
														{JSON.stringify(atomUpdate.oldValue)}
													</span>
													{` -> `}
													<span className="value new_value">
														{JSON.stringify(atomUpdate.newValue)}
													</span>
												</span>
											</div>
										)
									})}
							</section>
						</div>
					)
				})}
			</main>
		</section>
	)
}

export const TransactionIndex: FC = () => {
	const tokenIds = useO(transactionIndex)
	return (
		<section className="transaction_index">
			<h2>transactions</h2>
			<main>
				{tokenIds
					.filter((token) => !token.key.startsWith(`👁‍🗨`))
					.map((token) => {
						return (
							<TransactionLog
								key={token.key}
								token={token}
								logState={findTransactionLogState(token.key)}
							/>
						)
					})}
			</main>
		</section>
	)
}
