export const JSON_SCHEMA_STRING_FORMATS = [
  `date-time`,
  `date`,
  `email`,
  `hostname`,
  `ipv4`,
  `ipv6`,
  `regex`,
  `time`,
  `uri-reference`,
  `uri-template`,
  `uri`,
  `uuid`,
] as const

export type JsonSchemaStringFormat = (typeof JSON_SCHEMA_STRING_FORMATS)[number]
