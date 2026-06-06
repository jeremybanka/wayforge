import type { JSX } from "react/jsx-runtime"
import { create } from "zustand"

type CartProduct = {
	id: string
	name: string
	price: number
}

type CartItem = CartProduct & {
	quantity: number
}

type CartStore = {
	items: CartItem[]
	couponCode: string
	addItem: (product: CartProduct) => void
	removeItem: (id: string) => void
	setCouponCode: (couponCode: string) => void
}

const featuredProduct: CartProduct = {
	id: `notebook`,
	name: `Notebook`,
	price: 18,
}

const useCartStore = create<CartStore>((set) => ({
	items: [],
	couponCode: ``,
	addItem: (product) => {
		set((state) => {
			const existingItem = state.items.find((item) => item.id === product.id)
			if (existingItem) {
				return {
					items: state.items.map((item) =>
						item.id === product.id
							? { ...item, quantity: item.quantity + 1 }
							: item,
					),
				}
			}
			return { items: [...state.items, { ...product, quantity: 1 }] }
		})
	},
	removeItem: (id) => {
		set((state) => ({
			items: state.items.filter((item) => item.id !== id),
		}))
	},
	setCouponCode: (couponCode) => {
		set({ couponCode })
	},
}))

const selectCartItemCount = (state: CartStore): number =>
	state.items.reduce((total, item) => total + item.quantity, 0)

const selectCartSubtotal = (state: CartStore): number =>
	state.items.reduce((total, item) => total + item.price * item.quantity, 0)

function AddToCartButton(): JSX.Element {
	const itemCount = useCartStore(selectCartItemCount)
	const addItem = useCartStore((state) => state.addItem)

	return (
		<button
			type="button"
			onClick={() => {
				addItem(featuredProduct)
			}}
		>
			Add notebook ({itemCount})
		</button>
	)
}

function CouponInput(): JSX.Element {
	const couponCode = useCartStore((state) => state.couponCode)
	const setCouponCode = useCartStore((state) => state.setCouponCode)

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
	const subtotal = useCartStore(selectCartSubtotal)
	const couponCode = useCartStore((state) => state.couponCode)
	const discount = couponCode === `SAVE10` ? subtotal * 0.1 : 0
	const total = subtotal - discount

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
