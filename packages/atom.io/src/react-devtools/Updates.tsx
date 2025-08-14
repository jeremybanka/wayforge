import type {
	AtomUpdateEvent,
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
	event: AtomUpdateEvent<unknown>
}> = ({ event }) => {
	const { token, update } = event
	return (
		<article
			key={token.key}
			className="node atom_update"
			onClick={() => {
				console.log(event)
			}}
			onKeyUp={() => {
				console.log(event)
			}}
		>
			<span className="detail">{token.key}: </span>
			<span>
				<span className="summary">
					{prettyJson.diff(update.oldValue, update.newValue).summary}
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
					{transactionUpdate.events
						.filter(
							(event) =>
								event.type !== `molecule_creation` &&
								event.type !== `molecule_disposal` &&
								event.type !== `molecule_transfer` &&
								event.type !== `creation` &&
								event.type !== `disposal` &&
								!event.token.key.startsWith(`👁‍🗨`),
						)
						.map((event, index) => {
							switch (event.type) {
								case `update`:
									if (event.subType === `atom`) {
										return (
											<article.AtomUpdate
												key={`${transactionUpdate.token.key}:${index}:${event.token.key}`}
												serialNumber={index}
												event={event}
											/>
										)
									}
									return null
								case `transaction_update`:
									return (
										<TransactionUpdateFC
											key={`${transactionUpdate.token.key}:${index}:${event.token.key}`}
											serialNumber={index}
											transactionUpdate={event}
										/>
									)
								case `molecule_creation`:
								case `molecule_disposal`:
								case `molecule_transfer`:
								case `creation`:
								case `disposal`:
									return null
							}
						})}
				</section>
			</main>
		</article>
	)
}

export const TimelineUpdateFC: React.FC<{
	timelineUpdateEvent: TimelineEvent<any>
	serialNumber: number
}> = ({ timelineUpdateEvent, serialNumber }) => {
	return `token` in timelineUpdateEvent ? (
		<article
			className="node timeline_update"
			data-testid={`timeline-update-${typeof timelineUpdateEvent.token.key === `string` ? timelineUpdateEvent.token.key : stringifyJson(timelineUpdateEvent.token.key)}-${serialNumber}`}
		>
			<header>
				<h4>
					{timelineUpdateEvent.timestamp}: {timelineUpdateEvent.type} (
					{timelineUpdateEvent.token.key})
				</h4>
			</header>
			<main>
				{timelineUpdateEvent.type === `transaction_update` ? (
					timelineUpdateEvent.events
						.filter(
							(event) =>
								event.type !== `molecule_creation` &&
								event.type !== `molecule_disposal` &&
								event.type !== `molecule_transfer` &&
								event.type !== `creation` &&
								event.type !== `disposal` &&
								!event.token.key.startsWith(`👁‍🗨`),
						)
						.map((event, index) => {
							switch (event.type) {
								case `update`:
									if (event.subType === `atom`) {
										return (
											<article.AtomUpdate
												key={`${timelineUpdateEvent.token.key}:${index}:${event.token.key}`}
												serialNumber={index}
												event={event}
											/>
										)
									}
									return null
								case `transaction_update`:
									return (
										<TransactionUpdateFC
											key={`${timelineUpdateEvent.token.key}:${index}:${event.token.key}`}
											serialNumber={index}
											transactionUpdate={event}
										/>
									)
								case `molecule_creation`:
								case `molecule_disposal`:
								case `molecule_transfer`:
								case `creation`:
								case `disposal`:
									return null
							}
						})
				) : timelineUpdateEvent.type === `update` &&
					timelineUpdateEvent.subType === `selector` ? (
					timelineUpdateEvent.events
						.filter((event) => !event.token.key.startsWith(`👁‍🗨`))
						.map((atomUpdate, index) => {
							return (
								<article.AtomUpdate
									key={`${timelineUpdateEvent.token.key}:${index}:${atomUpdate.token.key}`}
									serialNumber={index}
									event={atomUpdate}
								/>
							)
						})
				) : timelineUpdateEvent.type === `update` &&
					timelineUpdateEvent.subType === `atom` ? (
					<article.AtomUpdate
						serialNumber={timelineUpdateEvent.timestamp}
						event={timelineUpdateEvent}
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
