// import type { FC } from "react"

// import type { RecoilState } from "recoil"
// import { useRecoilState } from "recoil"

// import type { Energy } from "./energy"

// export type RecoilListItemProps<T> = {
//   id: string
//   findState: (key: string) => RecoilState<T>
// }

// export type RecoilListProps<T> = {
//   indexState: RecoilState<string>
//   findState: (key: string) => RecoilState<T[]>
//   ListItem: FC<RecoilListItemProps<T>>
//   css?: string
//   numbered?: boolean
// }

// export const FCG = <T>

// export const RecoilList: <T>(
//   props: {
//     indexState: RecoilState<string>
//     findState: (key: string) => RecoilState<T[]>
//     ListItem: FC<RecoilListItemProps<T>>
//     css?: string
//     numbered?: boolean
//   },
//   context?: any
// ) => ReactElement<any, any> | null = ({
//   indexState,
//   findState,
//   ListItem,
//   css = ``,
//   numbered = false,
// }) => {
//   const l = numbered ? `ol` : `ul`
//   const ids = useRecoilState(indexState)
//   return createElement(
//     l,
//     {
//       css: css,
//     },
//     ids.map((id) => createElement(ListItem, { id, findState: state }))
//   )
// }

// export const EnergyListItem: FC<RecoilIndexProps<Energy>> = ({
//   id,
//   findState,
// }) => {
//   const energyState = findState(id)
//   const [energy, setEnergy] = useRecoilState(energyState)
//   return (
//     <div>
//       <div>{energy.id}</div>
//       <div>{energy.name}</div>
//     </div>
//   )
// }
