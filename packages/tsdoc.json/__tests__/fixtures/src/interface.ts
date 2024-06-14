/**
 * @public
 * An interface.
 */
export interface InterfaceDeclaration {
	/**
	 * @public
	 * Call signature.
	 */
	(): string
	/**
	 * An interface property.
	 */
	[Symbol.dispose]: string
}
