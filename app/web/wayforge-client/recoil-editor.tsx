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

export type RecoilEditorRouterAdaptorProps<T> = {
  Editor: FC<RecoilEditorProps<T>>
  findState: (key: string) => RecoilState<T>
  useRemove: () => (id: string) => void
}

export const IdFromRoute = <T,>({
  Editor,
  findState,
  useRemove,
}: RecoilEditorRouterAdaptorProps<T>): JsxElements => {
  const { id } = useParams<{ id: string }>()
  if (!id) {
    throw new Error(`RouterAdaptor must be used with a route that has an id`)
  }
  return <Editor id={id} findState={findState} useRemove={useRemove} />
}

export const makeListItemAdaptor = <T,>(
  Editor: FC<RecoilEditorProps<T>>
): { ListItemAdaptor: FC<RecoilListItemProps<T>> } => ({
  ListItemAdaptor: ({
    label,
    findState,
    removeMe,
  }: RecoilListItemProps<T> & {
    Editor: FC<RecoilEditorProps<T>>
  }): JsxElements => {
    const { id } = label
    return <Editor id={id} findState={findState} useRemove={() => removeMe} />
  },
})

export const RecoilEditor = {
  makeListItemAdaptor,
  IdFromRoute,
}
