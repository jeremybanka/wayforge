import type { FC } from "react"

import type { RecoilState } from "recoil"

import type { JsxElements, WC } from "~/lib/react-ui/json-editor"

export type RecoilListItemProps<T> = {
  id: string
  findState: (key: string) => RecoilState<T>
  removeMe: () => void
}

export type RecoilListProps<T> = {
  ids: string[]
  findState: (id: string) => RecoilState<T>
  useCreate?: () => () => void
  useRemove?: () => (id: string) => void
  Components: {
    Wrapper?: WC
    ItemCreator?: FC<{
      useCreate: () => () => void
    }>
    ListItem: FC<RecoilListItemProps<T>>
    ListItemWrapper?: WC
  }
}

export const RecoilList = <T,>({
  ids,
  findState,
  useCreate,
  useRemove,
  Components: {
    Wrapper = ({ children }) => <>{children}</>,
    ListItem,
    ListItemWrapper = ({ children }) => <>{children}</>,
    ItemCreator,
  },
}: RecoilListProps<T>): JsxElements => {
  const remove =
    useRemove?.() ||
    ((id) =>
      console.warn(`tried to remove ${id}, but no useRemove was provided`))
  return (
    <Wrapper>
      {ids.map((id) => (
        <ListItemWrapper key={id}>
          <ListItem id={id} findState={findState} removeMe={() => remove(id)} />
        </ListItemWrapper>
      ))}
      {ItemCreator && useCreate && <ItemCreator useCreate={useCreate} />}
    </Wrapper>
  )
}
