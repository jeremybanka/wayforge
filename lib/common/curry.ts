export function curry<
  A0,
  A1,
  Return,
  F extends (...args: [a0: A0, a1: A1]) => Return
>(f: F): (a0: A0) => (a1: A1) => Return
export function curry<
  A0,
  A1,
  A2,
  R,
  F extends (...args: [a0: A0, a1: A1, a2: A2]) => R
>(f: F): (a0: A0) => (a1: A1) => (a2: A2) => R
export function curry<
  A0,
  A1,
  A2,
  A3,
  Return,
  F extends (...args: [a0: A0, a1: A1, a2: A2, a3: A3]) => Return
>(f: F): (a0: A0) => (a1: A1) => (a2: A2) => (a3: A3) => Return {
  return (a0) => (a1) => (a2) => (a3) => f(a0, a1, a2, a3)
}

const add = (a: number, b: number) => a + b
const addCurried = curry(add)
const add1 = addCurried(1)
