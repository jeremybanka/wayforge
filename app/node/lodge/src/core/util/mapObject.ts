function mapObject<K extends number | string, I, O>(
  obj: Partial<Record<K, I>> | Record<K, I>,
  fn: (val: I) => O
): Record<K, O> {
  const newObj = {} as Record<K, O>
  const entries = Object.entries(obj) as [K, I][]
  const newEntries = entries.map((entry) => [entry[0], fn(entry[1])] as [K, O])
  newEntries.forEach((entry: [K, O]) => {
    newObj[entry[0] as K] = entry[1]
  })
  return newObj
}

export default mapObject
