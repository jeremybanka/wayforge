const wrapAround = (value: number, [min, max]: [number, number]): number => {
  const range = max - min
  return ((((value - min) % range) + range) % range) + min
}

export default wrapAround
