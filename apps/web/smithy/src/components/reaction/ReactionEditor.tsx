import "../styles/json-editor-skeletal.scss"

import { findState, selector, setState } from "atom.io"
import type { Json } from "atom.io/json"
import { useI, useO } from "atom.io/react"
import type { FC } from "react"

import { includesAny } from "~/packages/anvl/src/array/venn"
import { become, raiseError } from "~/packages/anvl/src/function"
import type {
	AtomEditorProps,
	FromListItemProps,
} from "~/packages/hamr/atom.io-tools/src"
import { AtomEditor } from "~/packages/hamr/atom.io-tools/src"
import { JsonEditor } from "~/packages/hamr/react-json-editor/src"

import { energyAtoms, energyIndex } from "../../services/energy"
import type { Product, Reagent } from "../../services/energy_reaction"
import type { Reaction, ReactionRelations } from "../../services/reaction"
import {
	reactionIndex,
	reactionSchemaState,
	reactionWithRelationsAtoms,
} from "../../services/reaction"
import { SVG_EnergyIcon } from "../energy/EnergyIcon"
import { RecoverableErrorBoundary } from "../RecoverableErrorBoundary"

export const energySelectState = selector<{ value: string; text: string }[]>({
	key: `energyCatalog`,
	get: ({ get }) => {
		const energyIds = get(energyIndex)
		return [...energyIds].map((id) => ({
			value: id,
			text: get(energyAtoms, id).name,
		}))
	},
})

export type SetterOrUpdater<T, N extends T = T> = (
	newValue: N | ((currVal: T) => N),
) => void

export type Settable<T extends Json.Object> = T & { set: SetterOrUpdater<T> }

export const isFn = (x: unknown): x is CallableFunction =>
	typeof x === `function`

export const ReactionEditor: FC<
	AtomEditorProps<Reaction & ReactionRelations>
> = ({ id: reactionId, family, useRemove }) => {
	const reactionState = findState(family, reactionId)
	const setReaction = useI(reactionState)
	const reaction = useO(reactionState)

	const set: {
		[K in keyof Omit<Reaction & ReactionRelations, `id`>]: SetterOrUpdater<
			(Reaction & ReactionRelations)[K]
		>
	} = {
		name: (name) => {
			setReaction((current) => ({
				...current,
				name: become(name)(current.name),
			}))
		},
		time: (time) => {
			setReaction((current) => ({
				...current,
				time: become(time)(current.time),
			}))
		},
		timeUnit: (timeUnit) => {
			setReaction((current) => ({
				...current,
				timeUnit: become(timeUnit)(current.timeUnit),
			}))
		},
		reagents: (reagents) => {
			setReaction((current) => ({
				...current,
				reagents: become(reagents)(current.reagents),
			}))
		},
		products: (products) => {
			setReaction((current) => ({
				...current,
				products: become(products)(current.products),
			}))
		},
		featureOf: (featureOf) => {
			setReaction((current) => ({
				...current,
				featureOf: become(featureOf)(current.featureOf),
			}))
		},
	}
	const add = {
		reagent: (id: string) => {
			set.reagents([...reaction.reagents, { id, amount: 1 }])
		},
		product: (id: string) => {
			set.products([...reaction.products, { id, amount: 1 }])
		},
	}
	const remove = Object.assign(useRemove(), {
		reagent: (id: string) => {
			set.reagents(reaction.reagents.filter((r) => r.id !== id))
		},
		product: (id: string) => {
			set.products(reaction.products.filter((p) => p.id !== id))
		},
		featureOf: () => {
			set.featureOf(null)
		},
	})
	const find = {
		reagent: (reagentId: string): Settable<Reagent> => ({
			...(reaction.reagents.find((r) => r.id === reagentId) ??
				raiseError(`wtf`)),
			set: (reagent) => {
				set.reagents((current) =>
					current.map((r) => (r.id === reagentId ? become(reagent)(r) : r)),
				)
			},
		}),
		product: (productId: string): Settable<Product> => ({
			...(reaction.products.find((p) => p.id === productId) ??
				raiseError(`wtf`)),
			set: (product) => {
				set.products((current) =>
					current.map((p) => (p.id === productId ? become(product)(p) : p)),
				)
			},
		}),
	}

	const removeMe = () => {
		remove(reactionId)
	}

	const reactionSchema = useO(reactionSchemaState)

	const energySelectables = useO(energySelectState)
	return (
		<RecoverableErrorBoundary>
			<JsonEditor
				schema={reactionSchema}
				data={reaction}
				set={setReaction}
				name={reaction.name}
				rename={set.name}
				remove={() => {
					console.log(`remove reaction ${reactionId}`)
					removeMe()
				}}
				isHidden={includesAny([
					`id`,
					`name`,
					`reagents`,
					`products`,
					`featureOf`,
					`energy`,
				])}
			/>
			{reaction.reagents.map(({ id: reagentId }) => (
				<span key={reagentId}>
					<JsonEditor
						data={find.reagent(reagentId).amount}
						set={(amount) => {
							find.reagent(reagentId).set((current) => ({
								...current,
								amount: become(amount)(current.amount),
							}))
						}}
						remove={() => {
							remove.reagent(reagentId)
						}}
						style={{ display: `inline` }}
					/>
					<SVG_EnergyIcon energyId={reagentId} size={40} />
				</span>
			))}
			<select
				onChange={(e) => {
					add.reagent(e.target.value)
				}}
			>
				{[null, ...energySelectables].map((option) => {
					if (option === null) {
						return (
							<option key={reactionId + `reagent_add`} value={``}>
								+
							</option>
						)
					}
					return (
						<option
							key={option.value + reactionId + `reagent`}
							value={option.value}
						>
							{option.text}
						</option>
					)
				})}
			</select>
			{`->`}
			{reaction.products.map(({ id: productId }) => (
				<span key={productId}>
					<JsonEditor
						data={find.product(productId).amount}
						set={(amount) => {
							find.product(productId).set((current) => ({
								...current,
								amount: become(amount)(current.amount),
							}))
						}}
						remove={() => {
							remove.product(productId)
						}}
						style={{ display: `inline` }}
					/>
					<SVG_EnergyIcon energyId={productId} size={40} />
				</span>
			))}
			<select
				onChange={({ target: { value } }) => {
					if (value) {
						add.product(value)
					}
				}}
				value={``}
			>
				{[null, ...energySelectables].map((option) => {
					if (option === null) {
						return (
							<option key={reactionId + `product_add`} value={``}>
								+
							</option>
						)
					}
					return (
						<option
							key={option.value + reactionId + `product`}
							value={option.value}
						>
							{option.text}
						</option>
					)
				})}
			</select>
			<div>
				{reaction.featureOf ? (
					<span>
						<SVG_EnergyIcon energyId={reaction.featureOf.id} size={40} />
						<button
							type="button"
							onClick={() => {
								set.featureOf(null)
							}}
						>
							remove
						</button>
					</span>
				) : (
					<select
						onChange={({ target: { value } }) => {
							if (value) {
								set.featureOf({ id: value })
							}
						}}
						value={``}
					>
						{[null, ...energySelectables].map((option) => {
							if (option === null) {
								return (
									<option key={reactionId + `featureOf_add`} value={``}>
										+
									</option>
								)
							}
							return (
								<option
									key={option.value + reactionId + `featureOf`}
									value={option.value}
								>
									{option.text}
								</option>
							)
						})}
					</select>
				)}
			</div>
		</RecoverableErrorBoundary>
	)
}

export const ReactionEditorListItem: FC<
	FromListItemProps<Reaction & ReactionRelations>
> = ({ label, family, removeMe }) => (
	<AtomEditor.ListItem
		label={label}
		family={family}
		removeMe={removeMe}
		Editor={ReactionEditor}
	/>
)

export const ReactionEditorFromRoute: FC = () => (
	<AtomEditor.IdFromRoute
		Editor={ReactionEditor}
		family={reactionWithRelationsAtoms}
		useRemove={() => (id) => {
			setState(reactionIndex, (current) => {
				const next = new Set<string>(current)
				next.delete(id)
				return next
			})
		}}
	/>
)
