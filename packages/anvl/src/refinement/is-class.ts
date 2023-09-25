export type ClassSignature = abstract new (...args: any) => any

export const isClass =
	<CS extends ClassSignature>(signature: CS) =>
	(input: unknown): input is InstanceType<ClassSignature> =>
		input instanceof signature
