import type { FC } from "react"

import type { RecoilState } from "recoil"

import type { Identified } from "~/lib/id/identified"
import type { JsxElements, WC } from "~/lib/react-ui/json-editor"

/* eslint-disable @typescript-eslint/ban-types */

export type RecoilListItemProps<DATA, META = {}> = {
  label: Identified & META
  findState: (key: string) => RecoilState<DATA>
  removeMe: () => void
}

export type RecoilListProps<DATA, META = {}> = {
  labels: (Identified & META)[]
  findState: (id: string) => RecoilState<DATA>
  useCreate?: () => () => void
  useRemove?: () => (id: string) => void
  Components: {
    Wrapper?: WC
    ItemCreator?: FC<{
      useCreate: () => () => void
    }>
    ListItem: FC<RecoilListItemProps<DATA, META>>
    ListItemWrapper?: WC
  }
}

export const RecoilList = <DATA, META = {}>({
  labels,
  findState,
  useCreate,
  useRemove,
  Components: {
    Wrapper = ({ children }) => <>{children}</>,
    ListItem,
    ListItemWrapper = ({ children }) => <>{children}</>,
    ItemCreator,
  },
}: RecoilListProps<DATA, META>): JsxElements => {
  const remove =
    useRemove?.() ||
    ((id) =>
      console.warn(`tried to remove ${id}, but no useRemove was provided`))
  return (
    <Wrapper>
      {labels.map((label) => (
        <ListItemWrapper key={label.id}>
          <ListItem
            label={label}
            findState={findState}
            removeMe={() => remove(label.id)}
          />
        </ListItemWrapper>
      ))}
      {ItemCreator && useCreate && <ItemCreator useCreate={useCreate} />}
    </Wrapper>
  )
}
