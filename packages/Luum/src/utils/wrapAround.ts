const wrapAround = (value: number, [min, max]: [number, number]): number => {
  const range = max - min
  while (value >= max) value -= range
  while (value < min) value += range
  return value
}

export default wrapAround
