export type JsonSummary = {
  name: string
  type: string
  id: number | string | null
}

export type JsonEditorHeaderProps = {
  json: RefinedJson
  schema: JsonSchema
}

export const summarizeObject = (
  obj: JsonObj,
  schema: JsonSchema
): JsonSummary => ({
  name: isString(obj.name) ? obj.name : `Object`,
  type: isString(obj.type) ? obj.type : `unknown`,
  id: isString(obj.id) ? obj.id : ``,
})

export const summarizeArray = (
  arr: JsonArr,
  schema: JsonSchema
): JsonSummary => ({
  name: `Array`,
  type: schema.type ?? `mixed`,
})
const summaries: {
  [K in keyof JsonTypes]: (
    json: JsonTypes[K],
    schema: Exclude<JsonSchema, boolean>
  ) => JsonSummary
} = {
  object: summarizeObject,
  array: summarizeArray,
  string: summarizeString,
  number: summarizeNumber,
  boolean: summarizeBoolean,
  null: summarizeNull,
}

const

export const JsonEditorHeader = ({
  json,
  schema,
}: JsonEditorHeaderProps): ReturnType<FC> => {
  const summarize = summaries[json.type] //as (json: Json) => JsonSummary
  const summary = summarize(json.data, schema)
  return (
    <div className="__JSON__summary">
      <div className="__JSON__title">{title}</div>
      <div className="__JSON__pattern">{pattern}</div>
      <div className="__JSON__identity">{identity}</div>
    </div>
  )
}
