import type {
	AtomToken,
	AtomUpdateEvent,
	TimelineEvent,
	TransactionOutcomeEvent,
	TransactionToken,
} from "atom.io"
import { discoverType, prettyJson } from "atom.io/introspection"
import { stringifyJson } from "atom.io/json"
import * as React from "react"

/* eslint-disable no-console */

const AtomUpdateFC: React.FC<{
	serialNumber: number
	atomUpdate: AtomUpdateEvent<AtomToken<unknown>>
}> = ({ atomUpdate }) => {
	return (
		<article
			key={atomUpdate.token.key}
			className="node atom_update"
			onClick={() => {
				console.log(atomUpdate)
			}}
			onKeyUp={() => {
				console.log(atomUpdate)
			}}
		>
			<span className="detail">{atomUpdate.token.key}: </span>
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
	transactionUpdate: TransactionOutcomeEvent<TransactionToken<any>>
}> = ({ serialNumber, transactionUpdate }) => {
	return (
		<article
			className="node transaction_update"
			data-testid={`transaction-update-${transactionUpdate.token.key}-${serialNumber}`}
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
					{transactionUpdate.subEvents
						.filter(
							(txSubEvent) =>
								txSubEvent.type !== `molecule_creation` &&
								txSubEvent.type !== `molecule_disposal` &&
								txSubEvent.type !== `molecule_transfer` &&
								txSubEvent.type !== `state_creation` &&
								txSubEvent.type !== `state_disposal` &&
								!txSubEvent.token.key.startsWith(`👁‍🗨`),
						)
						.map((update, index) => {
							switch (update.type) {
								case `atom_update`:
									return (
										<article.AtomUpdate
											key={`${transactionUpdate.token.key}:${index}:${update.token.key}`}
											serialNumber={index}
											atomUpdate={update}
										/>
									)
								case `transaction_outcome`:
									return (
										<TransactionUpdateFC
											key={`${transactionUpdate.token.key}:${index}:${update.token.key}`}
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
	return timelineUpdate.type === `atom_update` ||
		timelineUpdate.type === `selector_update` ||
		timelineUpdate.type === `transaction_outcome` ? (
		<article
			className="node timeline_update"
			data-testid={`timeline-update-${typeof timelineUpdate.token.key === `string` ? timelineUpdate.token.key : stringifyJson(timelineUpdate.token.key)}-${serialNumber}`}
		>
			<header>
				<h4>
					{timelineUpdate.timestamp}: {timelineUpdate.type} (
					{timelineUpdate.token.key})
				</h4>
			</header>
			<main>
				{timelineUpdate.type === `transaction_outcome` ? (
					timelineUpdate.subEvents
						.filter(
							(subEvent) =>
								subEvent.type !== `molecule_creation` &&
								subEvent.type !== `molecule_disposal` &&
								subEvent.type !== `molecule_transfer` &&
								subEvent.type !== `state_creation` &&
								subEvent.type !== `state_disposal` &&
								!subEvent.token.key.startsWith(`👁‍🗨`),
						)
						.map((subEvent, index) => {
							switch (subEvent.type) {
								case `atom_update`:
									return (
										<article.AtomUpdate
											key={`${timelineUpdate.token.key}:${index}:${subEvent.token.key}`}
											serialNumber={index}
											atomUpdate={subEvent}
										/>
									)
								case `transaction_outcome`:
									return (
										<TransactionUpdateFC
											key={`${timelineUpdate.token.key}:${index}:${subEvent.token.key}`}
											serialNumber={index}
											transactionUpdate={subEvent}
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
						.filter(
							(atomUpdateEvent) => !atomUpdateEvent.token.key.startsWith(`👁‍🗨`),
						)
						.map((event, index) => {
							switch (event.type) {
								case `atom_update`:
									return (
										<article.AtomUpdate
											key={`${timelineUpdate.token.key}:${index}:${event.token.key}`}
											serialNumber={index}
											atomUpdate={event}
										/>
									)
								case `state_creation`:
									return null
							}
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
