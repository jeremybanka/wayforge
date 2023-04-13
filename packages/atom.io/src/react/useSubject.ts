import type React from "react"

import type * as Rx from "rxjs"

type StateUpdate<N, O = N> = {
  newValue: N
  oldValue: O
}

const eq = <T>(oldValue: T, newValue: T): boolean => oldValue === newValue

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export const composeSubjectHook = (
  useState: typeof React.useState,
  useEffect: typeof React.useEffect
) => {
  function useSubject<T>(
    subject: Rx.Subject<StateUpdate<T>>,
    initialValue: T,
    compareFn: (oldValue: T, newValue: T) => boolean = eq
  ): [T, (newValue: T) => void] {
    const [state, setState] = useState(initialValue)

    useEffect(() => {
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
  return useSubject
}
