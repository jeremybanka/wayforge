import type { FC } from "react"
import type { SetterOrUpdater } from "recoil"
import { selector, useRecoilState, useRecoilValue } from "recoil"

import { includesAny } from "~/packages/anvl/src/array/venn"
import { become, raiseError } from "~/packages/anvl/src/function"
import type { Json } from "~/packages/anvl/src/json"
import { JsonEditor } from "~/packages/hamr/react-json-editor/src"
import { RecoverableErrorBoundary } from "~/packages/hamr/recoil-error-boundary/src"
import type {
	FromListItemProps,
	RecoilEditorProps,
} from "~/packages/hamr/recoil-tools/src"
import { RecoilEditor } from "~/packages/hamr/recoil-tools/src"

import { energyIndex, findEnergyState } from "../../services/energy"
import type { Product, Reagent } from "../../services/energy_reaction"
import type { Reaction, ReactionRelations } from "../../services/reaction"
import {
	findReactionWithRelationsState,
	reactionSchemaState,
	useRemoveReaction,
} from "../../services/reaction"
import { EnergyIconSVG } from "../energy/EnergyIcon"

import "../styles/json-editor-skeletal.scss"

export const energySelectState = selector<{ value: string; text: string }[]>({
	key: `energyCatalog`,
	get: ({ get }) => {
		const energyIds = get(energyIndex)
		return [...energyIds].map((id) => ({
			value: id,
			text: get(findEnergyState(id)).name,
		}))
	},
})

export type Settable<T extends Json.Object> = T & { set: SetterOrUpdater<T> }

export const isFn = (x: unknown): x is CallableFunction =>
	typeof x === `function`

export const ReactionEditor: FC<
	RecoilEditorProps<Reaction & ReactionRelations>
> = ({ id: identity, findState, useRemove }) => {
	const reactionState = findState(identity)
	const [reaction, setReaction] = useRecoilState(reactionState)

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
		remove(identity)
	}

	const reactionSchema = useRecoilValue(reactionSchemaState)

	const energySelectables = useRecoilValue(energySelectState)
	return (
		<RecoverableErrorBoundary>
			<JsonEditor
				schema={reactionSchema}
				data={reaction}
				set={setReaction}
				name={reaction.name}
				rename={set.name}
				remove={() => {
					console.log(`remove reaction ${identity}`)
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
					<EnergyIconSVG energyId={reagentId} size={40} />
				</span>
			))}
			<select
				onChange={(e) => {
					add.reagent(e.target.value)
				}}
			>
				{[null, ...energySelectables].map((option) =>
					option === null ? (
						<option key={identity + `reagent_add`} value={``}>
							+
						</option>
					) : (
						<option
							key={option.value + identity + `reagent`}
							value={option.value}
						>
							{option.text}
						</option>
					),
				)}
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
					<EnergyIconSVG energyId={productId} size={40} />
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
				{[null, ...energySelectables].map((option) =>
					option === null ? (
						<option key={identity + `product_add`} value={``}>
							+
						</option>
					) : (
						<option
							key={option.value + identity + `product`}
							value={option.value}
						>
							{option.text}
						</option>
					),
				)}
			</select>
			<div>
				{reaction.featureOf ? (
					<span>
						<EnergyIconSVG energyId={reaction.featureOf.id} size={40} />
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
						{[null, ...energySelectables].map((option) =>
							option === null ? (
								<option key={identity + `featureOf_add`} value={``}>
									+
								</option>
							) : (
								<option
									key={option.value + identity + `featureOf`}
									value={option.value}
								>
									{option.text}
								</option>
							),
						)}
					</select>
				)}
			</div>
		</RecoverableErrorBoundary>
	)
}

export const ReactionEditorListItem: FC<
	FromListItemProps<Reaction & ReactionRelations>
> = ({ label, findState, removeMe }) => (
	<RecoilEditor.ListItem
		label={label}
		findState={findState}
		removeMe={removeMe}
		Editor={ReactionEditor}
	/>
)

export const ReactionEditorFromRoute: FC = () => (
	<RecoilEditor.IdFromRoute
		Editor={ReactionEditor}
		findState={findReactionWithRelationsState}
		useRemove={useRemoveReaction}
	/>
)
