import type { FC } from "react"

import { css } from "@emotion/react"
import type { SetterOrUpdater } from "recoil"
import { selector, useRecoilState, useRecoilValue } from "recoil"

import type { RecoilListItemProps } from "~/app/web/wayforge-client/recoil-list"
import { includesAny } from "~/packages/anvl/src/array/venn"
import { become, raiseError } from "~/packages/anvl/src/function"
import type { JsonObj } from "~/packages/anvl/src/json"
import type { JsonSchema } from "~/packages/anvl/src/json/json-schema/json-schema"
import { RecoverableErrorBoundary } from "~/packages/hamr/react-ui/error-boundary"
import { JsonEditor } from "~/packages/hamr/react-ui/json-editor"

import type {
  FromListItemProps,
  RecoilEditorProps,
} from "../../../recoil-editor"
import { RecoilEditor } from "../../../recoil-editor"
import { energyIndex, findEnergyState } from "../../services/energy"
import type { Product, Reagent } from "../../services/energy_reaction"
import type { Reaction, ReactionRelations } from "../../services/reaction"
import {
  reactionSchemaState,
  findReactionWithRelationsState,
  findReactionState,
  useRemoveReaction,
} from "../../services/reaction"
import { SVG_EnergyIcon } from "../energy/EnergyIcon_SVG"
import { skeletalJsonEditorCss } from "../styles/skeletalJsonEditorCss"

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

export type Settable<T extends JsonObj> = T & { set: SetterOrUpdater<T> }

export const isFn = (x: unknown): x is CallableFunction =>
  typeof x === `function`

export const ReactionEditor: FC<
  RecoilEditorProps<Reaction & ReactionRelations>
> = ({ id, findState, useRemove }) => {
  const reactionState = findState(id)
  const [reaction, setReaction] = useRecoilState(reactionState)

  const set: {
    [K in keyof Omit<Reaction & ReactionRelations, `id`>]: SetterOrUpdater<
      (Reaction & ReactionRelations)[K]
    >
  } = {
    name: (name) =>
      setReaction((current) => ({
        ...current,
        name: become(name)(current.name),
      })),
    time: (time) =>
      setReaction((current) => ({
        ...current,
        time: become(time)(current.time),
      })),
    timeUnit: (timeUnit) =>
      setReaction((current) => ({
        ...current,
        timeUnit: become(timeUnit)(current.timeUnit),
      })),
    reagents: (reagents) =>
      setReaction((current) => ({
        ...current,
        reagents: become(reagents)(current.reagents),
      })),
    products: (products) =>
      setReaction((current) => ({
        ...current,
        products: become(products)(current.products),
      })),
    featureOf: (featureOf) =>
      setReaction((current) => ({
        ...current,
        featureOf: become(featureOf)(current.featureOf),
      })),
  }
  const add = {
    reagent: (id: string) =>
      set.reagents([...reaction.reagents, { id, amount: 1 }]),
    product: (id: string) =>
      set.products([...reaction.products, { id, amount: 1 }]),
  }
  const remove = Object.assign(useRemove(), {
    reagent: (id: string) =>
      set.reagents(reaction.reagents.filter((r) => r.id !== id)),
    product: (id: string) =>
      set.products(reaction.products.filter((p) => p.id !== id)),
    featureOf: () => set.featureOf(null),
  })
  const find = {
    reagent: (reagentId: string): Settable<Reagent> => ({
      ...(reaction.reagents.find((r) => r.id === reagentId) ??
        raiseError(`wtf`)),
      set: (reagent) =>
        set.reagents((current) =>
          current.map((r) => (r.id === reagentId ? become(reagent)(r) : r))
        ),
    }),
    product: (productId: string): Settable<Product> => ({
      ...(reaction.products.find((p) => p.id === productId) ??
        raiseError(`wtf`)),
      set: (product) =>
        set.products((current) =>
          current.map((p) => (p.id === productId ? become(product)(p) : p))
        ),
    }),
  }

  const removeMe = () => remove(id)

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
        remove={() => (console.log(`remove reaction ${id}`), removeMe())}
        isHidden={includesAny([
          `id`,
          `name`,
          `reagents`,
          `products`,
          `featureOf`,
          `energy`,
        ])}
        customCss={skeletalJsonEditorCss}
      />
      {reaction.reagents.map(({ id: reagentId }) => (
        <span key={reagentId}>
          <JsonEditor
            data={find.reagent(reagentId).amount}
            set={(amount) =>
              find.reagent(reagentId).set((current) => ({
                ...current,
                amount: become(amount)(current.amount),
              }))
            }
            remove={() => remove.reagent(reagentId)}
            customCss={css`
              display: inline;
              ${skeletalJsonEditorCss}
            `}
          />
          <SVG_EnergyIcon energyId={reagentId} size={40} />
        </span>
      ))}
      <select onChange={(e) => add.reagent(e.target.value)}>
        {[null, ...energySelectables].map((option) =>
          option === null ? (
            <option key={id + `reagent_add`} value={``}>
              +
            </option>
          ) : (
            <option key={option.value + id + `reagent`} value={option.value}>
              {option.text}
            </option>
          )
        )}
      </select>
      {`->`}
      {reaction.products.map(({ id: productId }) => (
        <span key={productId}>
          <JsonEditor
            data={find.product(productId).amount}
            set={(amount) =>
              find.product(productId).set((current) => ({
                ...current,
                amount: become(amount)(current.amount),
              }))
            }
            remove={() => remove.product(productId)}
            customCss={css`
              display: inline;
              ${skeletalJsonEditorCss}
            `}
          />
          <SVG_EnergyIcon energyId={productId} size={40} />
        </span>
      ))}
      <select
        onChange={({ target: { value } }) => value && add.product(value)}
        value={``}
      >
        {[null, ...energySelectables].map((option) =>
          option === null ? (
            <option key={id + `product_add`} value={``}>
              +
            </option>
          ) : (
            <option key={option.value + id + `product`} value={option.value}>
              {option.text}
            </option>
          )
        )}
      </select>
      <div>
        {reaction.featureOf ? (
          <span>
            <SVG_EnergyIcon energyId={reaction.featureOf.id} size={40} />
            <button onClick={() => set.featureOf(null)}>remove</button>
          </span>
        ) : (
          <select
            onChange={({ target: { value } }) =>
              value && set.featureOf({ id: value })
            }
            value={``}
          >
            {[null, ...energySelectables].map((option) =>
              option === null ? (
                <option key={id + `featureOf_add`} value={``}>
                  +
                </option>
              ) : (
                <option
                  key={option.value + id + `featureOf`}
                  value={option.value}
                >
                  {option.text}
                </option>
              )
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
