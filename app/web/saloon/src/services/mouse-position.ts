import * as React from "react"

import * as AtomIO from "atom.io"
import type { Point2d } from "corners"
import * as Rx from "rxjs"

import { findScrollPositionState } from "./scroll-position"

const mouse$ = Rx.fromEvent(window, `mousemove`).pipe(
  Rx.map<MouseEvent, Point2d>(({ clientX, clientY }) => ({
    x: clientX,
    y: clientY,
  })),
  Rx.sampleTime(200)
)

export const windowMousePositionState = AtomIO.atom<Point2d>({
  key: `windowMousePosition`,
  default: { x: 0, y: 0 },
  effects: [({ setSelf }) => mouse$.subscribe((pos) => setSelf(pos))],
})

export const findMousePositionState = AtomIO.atomFamily<Point2d, string>({
  key: `mousePosition`,
  default: { x: 0, y: 0 },
})

export const offsetMouseSelectorFam = AtomIO.selectorFamily<Point2d, string[]>({
  key: `offsetMouse`,
  get:
    ([mousePosKey, ...scrollPosKeys]) =>
    ({ get }) => {
      const mousePosition = get(findMousePositionState(mousePosKey))
      const offsets = scrollPosKeys.map((key) =>
        get(findScrollPositionState(key))
      )
      const totalOffset = offsets.reduce((tally, offset) => ({
        x: tally.x + offset.x,
        y: tally.y + offset.y,
      }))
      const x = mousePosition.x + totalOffset.x
      const y = mousePosition.y + totalOffset.y
      return { x, y }
    },
})

export const useMousePosition = <T extends HTMLElement>(
  key: string
): React.MutableRefObject<T | null> => {
  const nodeRef = React.useRef<T | null>(null)

  React.useEffect(() => {
    const mouse$ = nodeRef.current
      ? Rx.fromEvent(nodeRef.current, `mousemove`).pipe(
          Rx.map<MouseEvent, Point2d>(({ clientX, clientY }) => ({
            x: clientX,
            y: clientY,
          })),
          Rx.debounceTime(100)
        )
      : Rx.EMPTY

    const subscription = mouse$.subscribe((pos) => {
      AtomIO.setState(findMousePositionState(key), pos)
    })

    return subscription.unsubscribe
  }, [])

  return nodeRef
}
