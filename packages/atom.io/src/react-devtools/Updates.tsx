import type {
	StateUpdateEvent,
	TimelineEvent,
	TransactionOutcomeEvent,
} from "atom.io"
import type { Fn } from "atom.io/internal"
import { discoverType, prettyJson } from "atom.io/introspection"
import { stringifyJson } from "atom.io/json"
import * as React from "react"

/* eslint-disable no-console */

const AtomUpdateFC: React.FC<{
	serialNumber: number
	atomUpdate: StateUpdateEvent<unknown>
}> = ({ atomUpdate }) => {
	return (
		<article
			key={atomUpdate.key}
			className="node atom_update"
			onClick={() => {
				console.log(atomUpdate)
			}}
			onKeyUp={() => {
				console.log(atomUpdate)
			}}
		>
			<span className="detail">{atomUpdate.key}: </span>
			<span>
				<span className="summary">
					{
						prettyJson.diff(
							atomUpdate.update.oldValue,
							atomUpdate.update.newValue,
						).summary
					}
				</span>
			</span>
		</article>
	)
}

const TransactionUpdateFC: React.FC<{
	serialNumber: number
	transactionUpdate: TransactionOutcomeEvent<Fn>
}> = ({ serialNumber, transactionUpdate }) => {
	return (
		<article
			className="node transaction_update"
			data-testid={`transaction-update-${transactionUpdate.key}-${serialNumber}`}
		>
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
								onClick={() => {
									console.log(transactionUpdate)
								}}
								onKeyUp={() => {
									console.log(transactionUpdate)
								}}
							>
								<span className="detail">{discoverType(param)}: </span>
								<span className="summary">
									{typeof param === `object` &&
									param !== null &&
									`type` in param &&
									`target` in param
										? JSON.stringify(param.type)
										: JSON.stringify(param)}
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
						.filter(
							(token) =>
								token.type !== `molecule_creation` &&
								token.type !== `molecule_disposal` &&
								token.type !== `molecule_transfer` &&
								token.type !== `state_creation` &&
								token.type !== `state_disposal` &&
								!token.key.startsWith(`👁‍🗨`),
						)
						.map((update, index) => {
							switch (update.type) {
								case `atom_update`:
									return (
										<article.AtomUpdate
											key={`${transactionUpdate.key}:${index}:${update.key}`}
											serialNumber={index}
											atomUpdate={update}
										/>
									)
								case `transaction_outcome`:
									return (
										<TransactionUpdateFC
											key={`${transactionUpdate.key}:${index}:${update.key}`}
											serialNumber={index}
											transactionUpdate={update}
										/>
									)
								case `molecule_creation`:
								case `molecule_disposal`:
								case `molecule_transfer`:
								case `state_creation`:
								case `state_disposal`:
									return null
							}
						})}
				</section>
			</main>
		</article>
	)
}

export const TimelineUpdateFC: React.FC<{
	timelineUpdate: TimelineEvent<any>
	serialNumber: number
}> = ({ timelineUpdate, serialNumber }) => {
	return `key` in timelineUpdate ? (
		<article
			className="node timeline_update"
			data-testid={`timeline-update-${typeof timelineUpdate.key === `string` ? timelineUpdate.key : stringifyJson(timelineUpdate.key)}-${serialNumber}`}
		>
			<header>
				<h4>
					{timelineUpdate.timestamp}: {timelineUpdate.type} ({timelineUpdate.key}
					)
				</h4>
			</header>
			<main>
				{timelineUpdate.type === `transaction_outcome` ? (
					timelineUpdate.updates
						.filter(
							(token) =>
								token.type !== `molecule_creation` &&
								token.type !== `molecule_disposal` &&
								token.type !== `molecule_transfer` &&
								token.type !== `state_creation` &&
								token.type !== `state_disposal` &&
								!token.key.startsWith(`👁‍🗨`),
						)
						.map((update, index) => {
							switch (update.type) {
								case `atom_update`:
									return (
										<article.AtomUpdate
											key={`${timelineUpdate.key}:${index}:${update.key}`}
											serialNumber={index}
											atomUpdate={update}
										/>
									)
								case `transaction_outcome`:
									return (
										<TransactionUpdateFC
											key={`${timelineUpdate.key}:${index}:${update.key}`}
											serialNumber={index}
											transactionUpdate={update}
										/>
									)
								case `molecule_creation`:
								case `molecule_disposal`:
								case `molecule_transfer`:
								case `state_creation`:
								case `state_disposal`:
									return null
							}
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
	) : null
}

export const article: {
	AtomUpdate: typeof AtomUpdateFC
	TransactionUpdate: typeof TransactionUpdateFC
	TimelineUpdate: typeof TimelineUpdateFC
} = {
	AtomUpdate: AtomUpdateFC,
	TransactionUpdate: TransactionUpdateFC,
	TimelineUpdate: TimelineUpdateFC,
}
