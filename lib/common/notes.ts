// remove last element from tuple
export type Pop<T extends any[]> = T extends [...infer U, any] ? U : never

// remove last element from tuple if it is a function
export type PopIfFunction<T extends any[]> = T extends [
  ...infer U,
  (...args: any[]) => any
]
  ? U
  : T

export type OptionalPropertyOf<T extends object> = Exclude<
  {
    [K in keyof T]: T extends Record<K, T[K]> ? never : K
  }[keyof T],
  undefined
>
