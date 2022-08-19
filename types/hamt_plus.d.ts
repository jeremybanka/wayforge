/* eslint-disable quotes */
declare module "hamt_plus" {
  /* eslint-enable quotes */
  type CompareKeys = (x: string, y: string) => boolean

  export type Hamt<T = unknown> = {
    _config: {
      hash: (x: string) => number
      keyEq: CompareKeys
    }
    _edit: (x: any) => any
    _editable: boolean
    _root: {
      _modify: (
        x: number,
        compare: CompareKeys,
        z: number,
        f: (x: string) => number,
        hash: number,
        size: number
      ) => number
    }
    _size: number
    setTree: (newRoot: any, sizeValue: number) => Hamt<T>
    set: (key: string, value: T) => Hamt<T>
    get: (key: string, alt?: T) => T
    values: () => T[]
    keys: () => string[]
    entries: () => [key: string, value: T][]
  }
  const lib: {
    empty: <T>() => Hamt<T>
    make: <T>() => Hamt<T>
    hash: Hamt[`_config`][`hash`]

    setHash: <T>(hash: number, key: string, value: T, map: Hamt<T>) => Hamt<T>
    set: <T>(key: string, value: T, map: Hamt<T>) => Hamt<T>

    tryGetHash: <T>(alt: T, hash: number, key: string, map: Hamt<T>) => T
    tryGet: <T>(alt: T, key: string, map: Hamt<T>) => T
    getHash: <T>(hash: number, key: string, map: Hamt<T>) => T
    get: <T>(alt: T, key: string, map: Hamt<T>) => T

    hasHash: <T>(hash: number, key: string, map: Hamt<T>) => boolean
    has: <T>(key: string, map: Hamt<T>) => boolean

    isEmpty: (map: Hamt) => boolean

    modifyHash: <T>(
      f: (any) => any,
      hash: number,
      key: string,
      map: Hamt<T>
    ) => Hamt<T>
    modify: <T>(f: (any) => any, key: string, map: Hamt<T>) => Hamt<T>

    values: <T>(map: Hamt<T>) => T[]
    keys: <T>(map: Hamt<T>) => string[]
    entries: <T>(map: Hamt<T>) => [key: string, value: T][]
  }
  export default lib
}
