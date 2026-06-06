import { atom, atomFamily, runTransaction, selector, transaction } from "atom.io"
import { useI, useO } from "atom.io/react"
import type { JSX } from "react/jsx-runtime"

type CartProduct = {
	id: string
	name: string
	price: number
}

type CartItem = CartProduct & {
	quantity: number
}

const FEATURED_PRODUCT: CartProduct = {
	id: `notebook`,
	name: `Notebook`,
	price: 18,
}

const cartItemsKeysAtom = atom<string[]>({
	key: `cartItemsKeys`,
	default: [],
})

const cartItemAtoms = atomFamily<CartItem, string>({
	key: `cartItem`,
	default: (id) => ({
		id,
		name: id,
		price: 0,
		quantity: 0,
	}),
})

const couponCodeAtom = atom<string>({
	key: `couponCode`,
	default: ``,
})

const cartItemCountSelector = selector<number>({
	key: `cartItemCount`,
	get: ({ get }) =>
		get(cartItemsKeysAtom).reduce(
			(total, id) => total + get(cartItemAtoms, id).quantity,
			0,
		),
})

const cartSubtotalSelector = selector<number>({
	key: `cartSubtotal`,
	get: ({ get }) =>
		get(cartItemsKeysAtom).reduce((total, id) => {
			const item = get(cartItemAtoms, id)
			return total + item.price * item.quantity
		}, 0),
})

const cartTotalSelector = selector<number>({
	key: `cartTotal`,
	get: ({ get }) => {
		const subtotal = get(cartSubtotalSelector)
		const couponCode = get(couponCodeAtom)
		const discount = couponCode === `SAVE10` ? subtotal * 0.1 : 0
		return subtotal - discount
	},
})

const addCartItemTX = transaction<(product: CartProduct) => void>({
	key: `addCartItem`,
	do: ({ get, set }, product) => {
		const itemKeys = get(cartItemsKeysAtom)
		if (itemKeys.includes(product.id)) {
			set(cartItemAtoms, product.id, (item) => ({
				...item,
				quantity: item.quantity + 1,
			}))
			return
		}
		set(cartItemsKeysAtom, [...itemKeys, product.id])
		set(cartItemAtoms, product.id, { ...product, quantity: 1 })
	},
})

const addCartItem = runTransaction(addCartItemTX)

function AddToCartButton(): JSX.Element {
	const itemCount = useO(cartItemCountSelector)

	return (
		<button
			type="button"
			onClick={() => {
				addCartItem(FEATURED_PRODUCT)
			}}
		>
			Add notebook ({itemCount})
		</button>
	)
}

function CouponInput(): JSX.Element {
	const couponCode = useO(couponCodeAtom)
	const setCouponCode = useI(couponCodeAtom)

	return (
		<label>
			Coupon
			<input
				value={couponCode}
				onChange={(event) => {
					setCouponCode(event.currentTarget.value)
				}}
			/>
		</label>
	)
}

function CartSummary(): JSX.Element {
	const total = useO(cartTotalSelector)

	return <p>Total: ${total.toFixed(2)}</p>
}

export function ShoppingCart(): JSX.Element {
	return (
		<section>
			<AddToCartButton />
			<CouponInput />
			<CartSummary />
		</section>
	)
}
