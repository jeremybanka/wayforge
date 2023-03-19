import { produce } from "immer"
import { createStore } from "zustand/vanilla"

interface ISignInSheet {
  set: CallableFunction
  signedInUserIds: Set<number>
  signIn: CallableFunction
  signOut: CallableFunction
}

const signInSheet = createStore<ISignInSheet>((set) => ({
  set: (fn) => set(produce<ISignInSheet>(fn)),
  signedInUserIds: new Set(),
  signIn: (id: number) => {
    set((state) => {
      if (state.signedInUserIds.has(id)) {
        throw new Error(`User is already signed in.`)
      }
      return {
        ...state,
        signedInUserIds: state.signedInUserIds.add(id),
      }
    })
  },
  signOut: (id: number) => {
    set((state) => {
      if (!state.signedInUserIds.has(id)) {
        throw new Error(`User is not signed in.`)
      }

      const newSignedInUserIds = new Set(
        [...state.signedInUserIds.values()].filter((userId) => userId !== id)
      )
      return {
        ...state,
        signedInUserIds: newSignedInUserIds,
      }
    })
  },
}))

export const { signIn, signOut } = signInSheet.getState()
