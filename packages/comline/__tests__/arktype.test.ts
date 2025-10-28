import { type } from "arktype"

test(`arktype internal representation`, () => {
	const myObj = type({ "a?": `string`, b: `number`, c: { d: `boolean` } })
	console.log(myObj.toJSON())
	console.log(myObj.toJSON().required[1])
	console.log(type(`string`).toJSON())
	console.log(type(`string`).toJsonSchema())
	console.log(type(`unknown`).toJsonSchema())
	console.log(type({ a: `string` }).toJsonSchema())
	// console.log(myObj.to)
})
