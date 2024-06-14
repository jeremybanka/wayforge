/**
 * @public
 * A composite type.
 */
export type CompositeType = {
	/**
	 * @public
	 * A nested composite type.
	 */
	nestedCompositeType: {
		/**
		 * @public
		 * A deeply nested composite type.
		 */
		deeplyNestedCompositeType: number
	}
	/**
	 * @public
	 * A nested atomic type.
	 */
	nestedAtomicType: number
	anotherNestedType: string
}
