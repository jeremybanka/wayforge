export const resolveDelta = async (version: string): Promise<never> => {
	await Promise.resolve()
	throw new Error(`resolver invoked: ${version}`)
}
export const policy = (): never => {
	throw new Error("policy invoked")
}
export default {
	foo: "hello world",
	verbose: false,
	mode: "safe",
	count: 2,
	release: { resolveDelta, policy },
	secret: "token",
	created: new Date("2026-01-01"),
}
