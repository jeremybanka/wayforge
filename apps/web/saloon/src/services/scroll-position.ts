import * as React from "react"

import * as AtomIO from "atom.io"
import type { Point2d } from "corners"
import * as Rx from "rxjs"

const windowScroll$ = Rx.fromEvent(window, `scroll`).pipe(
  Rx.map<WheelEvent, Point2d>(() => ({ x: window.scrollX, y: window.scrollY })),
  Rx.debounceTime(100)
)

export const windowScrollPositionState = AtomIO.atom<Point2d>({
  key: `windowScrollPosition`,
  default: { x: 0, y: 0 },
  effects: [({ setSelf }) => windowScroll$.subscribe((pos) => setSelf(pos))],
})

export const findScrollPositionState = AtomIO.atomFamily<Point2d, string>({
  key: `scrollPosition`,
  default: { x: 0, y: 0 },
})

export const useScrollPosition = <T extends HTMLElement>(
  key: string
): React.MutableRefObject<T | null> => {
  const nodeRef = React.useRef<T | null>(null)

  React.useEffect(() => {
    const scroll$ = nodeRef.current
      ? Rx.fromEvent(nodeRef.current, `scroll`).pipe(
          Rx.map<WheelEvent, Point2d>(() => ({
            x: nodeRef.current?.scrollLeft || 0,
            y: nodeRef.current?.scrollTop || 0,
          })),
          Rx.debounceTime(100)
        )
      : Rx.EMPTY

    const subscription = scroll$.subscribe((pos) => {
      AtomIO.setState(findScrollPositionState(key), pos)
    })

    return subscription.unsubscribe
  }, [])

  return nodeRef
}
