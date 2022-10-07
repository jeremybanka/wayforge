import type { FC } from "react"

import type { JsxElements } from "hamr/react-ui/json-editor"
import { useParams } from "react-router-dom"
import type { RecoilState } from "recoil"

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

export const RouterAdaptor = <T,>({
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

export const RecoilEditor = {
  RouterAdaptor,
}
