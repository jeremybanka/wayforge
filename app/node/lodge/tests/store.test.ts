import { vitest } from "vitest"
import { subscribeWithSelector, combine } from "zustand/middleware"
import { createStore } from "zustand/vanilla"

vitest.spyOn(console, `info`)
vitest.spyOn(console, `warn`)

type Actions = {
  INCREMENT: () => void
  DECREMENT: () => void
}

type CounterState = {
  count: number
  timesCountWasSetToOne: number
  run: (action: keyof Actions) => void
  actions: Actions
}

const store = createStore(
  subscribeWithSelector(
    combine(
      combine(
        {
          count: 0,
          timesCountWasSetToOne: 0,
        },
        (_, get) => ({
          actions: {
            INCREMENT: () => ({
              count: get().count + 1,
            }),
            DECREMENT: () => ({
              count: get().count - 1,
            }),
          },
        })
      ),
      (set, get) => ({
        run: <A extends keyof ReturnType<ReturnType<typeof get>>[`actions`]>(
          action: A,
          payload: ReturnType<ReturnType<typeof get>>[`actions`][A]
        ) => set(get()().actions[action](payload)),
      })
    )
  )
)

store.subscribe((state) => console.info(state.count))
store.subscribe((state) => console.warn(state.timesCountWasSetToOne))

describe(`zustand store`, () => {
  it(`increments`, () => {
    store.getState().inc()
    expect(store.getState().count).toBe(1)
    expect(console.info).toHaveBeenCalledWith(1)
    expect(console.warn).toHaveBeenCalledWith(0)
    console.log(`store.getState()`, store.getState())
  })

  it(`decrements`, () => {
    store.getState().dec()
    expect(store.getState().count).toBe(0)
    expect(console.info).toHaveBeenCalledWith(0)
  })
})
