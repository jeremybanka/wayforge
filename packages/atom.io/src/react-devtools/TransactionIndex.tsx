import {
	transaction,
	type ReadonlySelectorToken,
	type TransactionToken,
	type TransactionUpdate,
} from "atom.io"
import { useO } from "atom.io/react"
import type { FC } from "react"

import type { ƒn } from "~/packages/anvl/src/function"
import { isPlainObject } from "~/packages/anvl/src/object"
import { Refinery } from "~/packages/anvl/src/refinement/refinery"
import {
	diffArray,
	diffBoolean,
	diffNumber,
	diffObject,
	diffString,
	Differ,
} from "~/packages/anvl/src/tree/differ"

import { findTransactionLogState, transactionIndex } from "."

const primitiveRefinery = new Refinery({
	number: (input: unknown): input is number => typeof input === `number`,
	string: (input: unknown): input is string => typeof input === `string`,
	boolean: (input: unknown): input is boolean => typeof input === `boolean`,
	null: (input: unknown): input is null => input === null,
})

const jsonTreeRefinery = new Refinery({
	object: isPlainObject,
	array: (input: unknown): input is unknown[] => Array.isArray(input),
})

const prettyJson = new Differ(primitiveRefinery, jsonTreeRefinery, {
	number: diffNumber,
	string: diffString,
	boolean: diffBoolean,
	null: () => ({ summary: `No Change` }),
	object: diffObject,
	array: diffArray,
})

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
							<header>
								<h4>{index}</h4>
							</header>
							<main>
								<section className="transaction_io">
									<div className="transaction_params">
										<span className="output_name">params: </span>
										{update.params.map((param, index) => {
											return (
												<div key={`param` + index} className="transaction_param">
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
