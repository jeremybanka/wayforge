import type { FC, ReactElement } from "react"

import { useParams } from "react-router-dom"
import type { RecoilState } from "recoil"

import type { RecoilListItemProps } from "./RecoilList"

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
}: IdFromRouteProps<T>): ReactElement => {
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
}: FromListItemProps<T>): ReactElement => {
  return (
    <Editor id={label.id} findState={findState} useRemove={() => removeMe} />
  )
}

export const RecoilEditor = {
  ListItem,
  IdFromRoute,
}
