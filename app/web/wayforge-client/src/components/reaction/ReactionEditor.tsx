import type { FC } from "react"

import { css } from "@emotion/react"
import type { SetterOrUpdater } from "recoil"
import { selector, useRecoilState, useRecoilValue } from "recoil"

// import reactionSchema from
// "~/app/node/wayforge-server/projects/wayfarer/schema/reaction.schema.json"
import type { RecoilListItemProps } from "~/app/web/wayforge-client/recoil-list"
import { includesAny } from "~/packages/anvl/src/array/venn"
import { become, raiseError } from "~/packages/anvl/src/function"
import type { JsonObj } from "~/packages/anvl/src/json"
import type { JsonSchema } from "~/packages/anvl/src/json/json-schema"
import { RecoverableErrorBoundary } from "~/packages/hamr/react-ui/error-boundary"
import { JsonEditor } from "~/packages/hamr/react-ui/json-editor"

import { energyIndex, findEnergyState } from "../../services/energy"
import type { Product, Reagent } from "../../services/energy_reaction"
import type { Reaction, ReactionRelations } from "../../services/reaction"
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
  RecoilListItemProps<Reaction & ReactionRelations>
> = ({ label, findState, removeMe }) => {
  const reactionState = findState(label.id)
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
        reagents:
          (console.log(become(reagents)(current.reagents)),
          become(reagents)(current.reagents)),
      })),
    products: (products) =>
      setReaction((current) => ({
        ...current,
        products: become(products)(current.products),
      })),
  }
  const add = {
    reagent: (id: string) =>
      set.reagents([...reaction.reagents, { id, amount: 1 }]),
    product: (id: string) =>
      set.products([...reaction.products, { id, amount: 1 }]),
  }
  const remove = {
    reagent: (id: string) =>
      set.reagents(reaction.reagents.filter((r) => r.id !== id)),
    product: (id: string) =>
      set.products(reaction.products.filter((p) => p.id !== id)),
  }
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
  const energySelectables = useRecoilValue(energySelectState)
  return (
    <RecoverableErrorBoundary>
      <JsonEditor
        // schema={reactionSchema as unknown as JsonSchema}
        data={reaction}
        set={setReaction}
        name={reaction.name}
        rename={set.name}
        remove={() => (console.log(`remove reaction ${label.id}`), removeMe())}
        isHidden={includesAny([`id`, `name`, `reagents`, `products`, `energy`])}
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
            <option key={label.id + `reagent_add`} value={``}>
              +
            </option>
          ) : (
            <option
              key={option.value + label.id + `reagent`}
              value={option.value}
            >
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
            <option key={label.id + `product_add`} value={``}>
              +
            </option>
          ) : (
            <option
              key={option.value + label.id + `product`}
              value={option.value}
            >
              {option.text}
            </option>
          )
        )}
      </select>
    </RecoverableErrorBoundary>
  )
}
