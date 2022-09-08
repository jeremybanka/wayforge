import { FC } from "react"

import type { RecoilState } from "recoil"

import type { JsxElements } from "."

export const JsonEditorRecoilComponent = <T,>({
  state,
}: {
  state: RecoilState<T>
}): JsxElements => {
  return null
}
