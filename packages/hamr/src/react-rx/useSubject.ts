import * as React from "react"

import type * as Rx from "rxjs"

import type { Modifier } from "~/packages/anvl/src/function"

type StateUpdate<N, O = N> = {
  newValue: N
  oldValue: O
}

const eq = <T>(oldValue: T, newValue: T): boolean => oldValue === newValue

export function useSubject<T>(
  initialValue: T,
  subject: Rx.Subject<StateUpdate<T>>,
  compareFn: (oldValue: T, newValue: T) => boolean = eq
): [T, (newValue: Modifier<T> | T) => void] {
  const [state, setState] = React.useState(initialValue)

  React.useEffect(() => {
    const subscription = subject.subscribe(({ newValue, oldValue }) => {
      if (!compareFn(oldValue, newValue)) {
        setState(newValue)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [state, compareFn, subject])

  const updateState = (newValue: T) => {
    subject.next({ newValue, oldValue: state })
  }

  return [state, updateState]
}
