import { attempt } from "../function"
import { isString } from "../primitive"

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

export type date_time = string & { readonly date_time: unique symbol }
export type date = string & { readonly date: unique symbol }
export type email = string & { readonly email: unique symbol }
export type hostname = string & { readonly hostname: unique symbol }
export type ipv4 = string & { readonly ipv4: unique symbol }
export type ipv6 = string & { readonly ipv6: unique symbol }
export type regex = string & { readonly regex: unique symbol }
export type time = string & { readonly time: unique symbol }
export type uri_reference = string & { readonly uri_reference: unique symbol }
export type uri_template = string & { readonly uri_template: unique symbol }
export type uri = string & { readonly uri: unique symbol }
export type uuid = string & { readonly uuid: unique symbol }

export const isDateTime = (input: unknown): input is date_time =>
	isString(input) &&
	input.match(
		/^([+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24:?00)([.,]\d+(?!:))?)?(\17[0-5]\d([.,]\d+)?)?([zZ]|([+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/,
	)?.length === 1

export const isDate = (input: unknown): input is date =>
	isString(input) &&
	input.match(
		/^([+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6]))))?$/,
	)?.length === 1

export const isEmail = (input: unknown): input is email =>
	isString(input) &&
	input.match(
		/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
	)?.length === 1

export const isHostname = (input: unknown): input is hostname =>
	isString(input) &&
	input.match(
		/^(?=.{1,253}$)(^((?!-)[a-zA-Z0-9-]{1,63}(?<!-)\.)+[a-zA-Z]{2,63}$)/,
	)?.length === 1

export const isIpv4 = (input: unknown): input is ipv4 =>
	isString(input) &&
	input.match(
		/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
	)?.length === 1

export const isIpv6 = (input: unknown): input is ipv6 => isString(input) // && net.isIPv6(input)

export const isRegex = (input: unknown): input is regex =>
	isString(input) && attempt(() => new RegExp(input))

export const isTime = (input: unknown): input is time =>
	isString(input) &&
	input.match(/^([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])(\.\d+)?$/)
		?.length === 1

export const isUriReference = (input: unknown): input is uri_reference =>
	isString(input) &&
	input.match(/^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/)
		?.length === 1

export const isUriTemplate = (input: unknown): input is uri_template =>
	isString(input) &&
	input.match(/^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/)
		?.length === 1

export const isUri = (input: unknown): input is uri =>
	isString(input) &&
	input.match(/^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/)
		?.length === 1

export const isUuid = (input: unknown): input is uuid =>
	isString(input) &&
	input.match(
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
	)?.length === 1
