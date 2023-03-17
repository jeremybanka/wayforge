import create from 'zustand/vanilla'
import produce from 'immer'

interface ISignInSheet {
  set: CallableFunction
  signedInUserIds: Set<number>
  signIn: CallableFunction
  signOut: CallableFunction
}

const signInSheet = create<ISignInSheet>(set => ({
  set: fn => set(produce(fn)),
  signedInUserIds: new Set(),
  signIn: (id:number) => {
    set(state => {
      if (state.signedInUserIds.has(id)) {
        throw new Error(`User is already signed in.`)
      }
      state.signedInUserIds.add(id)
    })
  },
  signOut: (id:number) => {
    set(state => {
      if (!state.signedInUserIds.has(id)) {
        throw new Error(`User is not signed in.`)
      }
      state.signedInUserIds.delete(id)
    })
  },
}))

export const {
  signIn,
  signOut,
} = signInSheet.getState()
