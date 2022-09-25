import type { FC } from "react"
import React, { Fragment } from "react"

import { useNavigate } from "react-router-dom"
import type { SetterOrUpdater } from "recoil"
import { selector, useRecoilState, useRecoilValue } from "recoil"

import reactionSchema from "~/app/wayforge-server/projects/wayfarer/schema/reaction.schema.json"
import { become, raiseError } from "~/lib/fp-tools"
import type { JsonObj } from "~/lib/json"
import type { JsonSchema } from "~/lib/json/json-schema"
import { RecoverableErrorBoundary } from "~/lib/react-ui/error-boundary"
import { JsonEditor } from "~/lib/react-ui/json-editor"
import { NumberInput } from "~/lib/react-ui/number-input"
import type { Identified } from "~/lib/recoil-tools/effects/socket-io.server"

import { energyIndex, findEnergyState } from "../../services/energy"
import type { Amount, Product, Reagent } from "../../services/energy_reaction"
import type { Reaction, ReactionRelations } from "../../services/reaction"
import type { RecoilIndexProps } from "../energy/EnergyListItem"
import { EnergyListItem } from "../energy/EnergyListItem"
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

/* eslint-disable @typescript-eslint/ban-types */
export const isFn = (x: unknown): x is Function => typeof x === `function`

export const ReactionEditor: FC<
  RecoilIndexProps<Reaction & ReactionRelations>
> = ({ id, findState }) => {
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
        schema={reactionSchema as unknown as JsonSchema}
        data={reaction}
        set={setReaction}
        name={reaction.name}
        rename={set.name}
        remove={() => console.log(`remove reaction`)}
        isReadonly={(path) => path.includes(`id`)}
        isHidden={(path) =>
          path.includes(`reagents`) || path.includes(`products`)
        }
        customCss={skeletalJsonEditorCss}
      />
      <div>
        <p>Reagents</p>
        {reaction.reagents.map(({ id: reagentId }) => (
          <ul key={reagentId}>
            <EnergyListItem id={reagentId} findState={findEnergyState} />
            <JsonEditor
              data={find.reagent(reagentId).amount}
              set={(amount) =>
                find.reagent(reagentId).set((current) => ({
                  ...current,
                  amount: become(amount)(current.amount),
                }))
              }
            />
            <button onClick={() => remove.reagent(reagentId)}>remove</button>
          </ul>
        ))}
        <select onChange={(e) => add.reagent(e.target.value)}>
          {[null, ...energySelectables].map((option) =>
            option === null ? (
              <option key={id + `reagent_add`} value={``}>
                Add reagent
              </option>
            ) : (
              <option key={option.value + id + `reagent`} value={option.value}>
                {option.text}
              </option>
            )
          )}
        </select>
      </div>
      <div>
        <p>Products</p>
        {reaction.products.map(({ id: productId }) => (
          <ul key={id}>
            <EnergyListItem id={id} findState={findEnergyState} />
            <NumberInput
              value={find.product(productId).amount}
              set={(amount) =>
                find
                  .product(productId)
                  .set((current) => ({ ...current, amount }))
              }
            />
            <button onClick={() => remove.product(productId)}>remove</button>
          </ul>
        ))}
        <select onChange={(e) => add.product(e.target.value)}>
          {[null, ...energySelectables].map((option) =>
            option === null ? (
              <option key={id + `product_add`} value={``}>
                Add product
              </option>
            ) : (
              <option key={option.value + id + `product`} value={option.value}>
                {option.text}
              </option>
            )
          )}
        </select>
      </div>
    </RecoverableErrorBoundary>
  )
}
