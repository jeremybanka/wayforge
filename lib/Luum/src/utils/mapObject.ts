const mapObject = <KeyedObj, I, O>(
  obj: { [K in keyof KeyedObj]: I },
  fn: (val: I, key: keyof KeyedObj) => O
): { [K in keyof KeyedObj]: O } => {
  const newObj = {} as { [K in keyof KeyedObj]: O }
  const entries = Object.entries(obj) as [keyof KeyedObj, I][]
  entries.forEach(([key, val]) => {
    newObj[key] = fn(val, key)
  })
  return newObj
}

export default mapObject
