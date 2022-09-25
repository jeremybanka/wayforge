type Clamp = (value: number, [min, max]: [number, number]) => number

const clamp: Clamp = (value, [min, max]) =>
  value > max ? max : value < min ? min : value

export default clamp
