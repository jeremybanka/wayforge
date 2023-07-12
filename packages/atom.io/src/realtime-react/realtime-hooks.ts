import type * as AtomIO from "atom.io"

import type { ƒn } from "~/packages/anvl/src/function"
import type { Json } from "~/packages/anvl/src/json"

import { usePull } from "./use-pull"
import { usePullFamily } from "./use-pull-family"
import { usePullFamilyMember } from "./use-pull-family-member"
import { usePush } from "./use-push"
import { useServerAction } from "./use-server-action"

export type RealtimeHooks = {
  usePull: <J extends Json>(token: AtomIO.StateToken<J>) => void
  usePullFamily: <J extends Json>(
    family: AtomIO.AtomFamily<J> | AtomIO.SelectorFamily<J>
  ) => void
  usePullFamilyMember: <J extends Json>(
    family: AtomIO.AtomFamily<J> | AtomIO.SelectorFamily<J>,
    subKey: string
  ) => void
  usePush: <J extends Json>(token: AtomIO.StateToken<J>) => void
  useServerAction: <ƒ extends ƒn>(
    token: AtomIO.TransactionToken<ƒ>
  ) => (...parameters: Parameters<ƒ>) => ReturnType<ƒ>
}

export const realtimeHooks: RealtimeHooks = {
  usePull,
  usePullFamily,
  usePullFamilyMember,
  usePush,
  useServerAction,
}

export * from "./use-pull"
export * from "./use-pull-family"
export * from "./use-pull-family-member"
export * from "./use-push"
export * from "./use-server-action"
