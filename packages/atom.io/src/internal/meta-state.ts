import type { Store } from "./store"
import { IMPLICIT } from "./store"
import type { AtomToken, ReadonlySelectorToken } from ".."
import { selector, atom } from ".."

export type AtomTokenIndex = Record<
  string,
  | AtomToken<unknown>
  | {
      key: string
      atoms: Record<string, AtomToken<unknown>>
    }
>

export const attachMetaState = (
  store: Store = IMPLICIT.STORE
): {
  atomTokenIndexState: ReadonlySelectorToken<AtomTokenIndex>
} => {
  const atomTokenIndexState__INTERNAL = atom<AtomTokenIndex>({
    key: `👁️‍🗨️_atom_token_index__INTERNAL`,
    default: () => {
      const entries = [...store.atoms]
      console.log(`entries`, entries)
      return [...store.atoms].reduce<AtomTokenIndex>((acc, [key]) => {
        acc[key] = { key, type: `atom` }
        return acc
      }, {})
    },
    effects: [
      ({ setSelf }) => {
        store.subject.atomCreation.subscribe((atomToken) => {
          setSelf((state) => {
            const { key, family } = atomToken
            if (family) {
              const { key: familyKey, subKey } = family
              const current = state[familyKey]
              if (`atoms` in current || current === undefined) {
                const familyKeyState = current || {
                  key: familyKey,
                  atoms: {},
                }
                return {
                  ...state,
                  [familyKey]: {
                    ...familyKeyState,
                    atoms: {
                      ...familyKeyState.atoms,
                      [subKey]: atomToken,
                    },
                  },
                }
              }
            }
            return {
              ...state,
              [key]: atomToken,
            }
          })
        })
      },
    ],
  })
  const atomTokenIndexState = selector({
    key: `👁️‍🗨️_atom_token_index`,
    get: ({ get }) => get(atomTokenIndexState__INTERNAL),
  })
  return {
    atomTokenIndexState,
  }
}
