import type { FC } from "react"

import { useParams } from "react-router-dom"
import type { RecoilState } from "recoil"

import type { JsxElements } from "~/packages/hamr/react-ui/json-editor"

import type { RecoilListItemProps } from "./recoil-list"

export type RecoilEditorProps<T> = {
  id: string
  findState: (key: string) => RecoilState<T>
  useRemove: () => (id: string) => void
}

export type IdFromRouteProps<T> = {
  Editor: FC<RecoilEditorProps<T>>
  findState: (key: string) => RecoilState<T>
  useRemove: () => (id: string) => void
}

export const IdFromRoute = <T,>({
  Editor,
  findState,
  useRemove,
}: IdFromRouteProps<T>): JsxElements => {
  const { id } = useParams<{ id: string }>()
  if (!id) {
    throw new Error(`RouterAdaptor must be used with a route that has an id`)
  }
  return <Editor id={id} findState={findState} useRemove={useRemove} />
}

export type FromListItemProps<T> = RecoilListItemProps<T> & {
  Editor: FC<RecoilEditorProps<T>>
}

export const ListItem = <T,>({
  Editor,
  label,
  findState,
  removeMe,
}: FromListItemProps<T>): JsxElements => {
  return (
    <Editor id={label.id} findState={findState} useRemove={() => removeMe} />
  )
}

export const RecoilEditor = {
  ListItem,
  IdFromRoute,
}
