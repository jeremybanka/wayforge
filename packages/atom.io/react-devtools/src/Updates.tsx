import type {
	KeyedStateUpdate,
	TimelineUpdate,
	TransactionUpdate,
	ƒn,
} from "atom.io"
import * as React from "react"

import { discoverType } from "~/packages/anvl/src/refinement/refinery"

import { prettyJson } from "."

const AtomUpdateFC: React.FC<{
	serialNumber: number
	atomUpdate: KeyedStateUpdate<unknown>
}> = ({ atomUpdate }) => {
	return (
		<article
			key={atomUpdate.key}
			className="node atom_update"
			onClick={() => console.log(atomUpdate)}
			onKeyUp={() => console.log(atomUpdate)}
		>
			<span className="detail">{atomUpdate.key}: </span>
			<span>
				<span className="summary">
					{prettyJson.diff(atomUpdate.oldValue, atomUpdate.newValue).summary}
				</span>
			</span>
		</article>
	)
}

const TransactionUpdateFC: React.FC<{
	serialNumber: number
	transactionUpdate: TransactionUpdate<ƒn>
}> = ({ serialNumber, transactionUpdate }) => {
	return (
		<article className="node transaction_update">
			<header>
				<h4>{serialNumber}</h4>
			</header>
			<main>
				<section className="transaction_params">
					<span className="detail">params: </span>
					{transactionUpdate.params.map((param, index) => {
						return (
							<article
								key={`param` + index}
								className="node transaction_param"
								onClick={() => console.log(transactionUpdate)}
								onKeyUp={() => console.log(transactionUpdate)}
							>
								<span className="detail">{discoverType(param)}: </span>
								<span className="summary">
									{typeof param === `object` &&
									param !== null &&
									`type` in param &&
									`target` in param ? (
										<>{JSON.stringify(param.type)}</>
									) : (
										<>{JSON.stringify(param)}</>
									)}
								</span>
							</article>
						)
					})}
				</section>
				<section className="node transaction_output">
					<span className="detail">output: </span>
					<span className="detail">
						{discoverType(transactionUpdate.output)}
					</span>
					{transactionUpdate.output ? (
						<span className="summary">
							: {JSON.stringify(transactionUpdate.output)}
						</span>
					) : null}
				</section>
				<section className="transaction_impact">
					<span className="detail">impact: </span>
					{transactionUpdate.updates
						.filter((token) => !token.key.startsWith(`👁‍🗨`))
						.map((atomUpdate, index) => {
							return (
								<article.AtomUpdate
									key={`${transactionUpdate.key}:${index}:${atomUpdate.key}`}
									serialNumber={index}
									atomUpdate={atomUpdate}
								/>
							)
						})}
				</section>
			</main>
		</article>
	)
}

export const TimelineUpdateFC: React.FC<{
	timelineUpdate: TimelineUpdate
}> = ({ timelineUpdate }) => {
	return (
		<article className="node timeline_update">
			<header>
				<h4>
					{timelineUpdate.timestamp}: {timelineUpdate.type} ({timelineUpdate.key}
					)
				</h4>
			</header>
			<main>
				{timelineUpdate.type === `transaction_update` ? (
					timelineUpdate.updates
						.filter((token) => !token.key.startsWith(`👁‍🗨`))
						.map((atomUpdate, index) => {
							return (
								<article.AtomUpdate
									key={`${timelineUpdate.key}:${index}:${atomUpdate.key}`}
									serialNumber={index}
									atomUpdate={atomUpdate}
								/>
							)
						})
				) : timelineUpdate.type === `selector_update` ? (
					timelineUpdate.atomUpdates
						.filter((token) => !token.key.startsWith(`👁‍🗨`))
						.map((atomUpdate, index) => {
							return (
								<article.AtomUpdate
									key={`${timelineUpdate.key}:${index}:${atomUpdate.key}`}
									serialNumber={index}
									atomUpdate={atomUpdate}
								/>
							)
						})
				) : timelineUpdate.type === `atom_update` ? (
					<article.AtomUpdate
						serialNumber={timelineUpdate.timestamp}
						atomUpdate={timelineUpdate}
					/>
				) : null}
			</main>
		</article>
	)
}

export const article = {
	AtomUpdate: AtomUpdateFC,
	TransactionUpdate: TransactionUpdateFC,
	TimelineUpdate: TimelineUpdateFC,
}
