import HAMT from "hamt_plus"
import * as v from "vitest"

v.describe(`nest a thousand members`, () => {
	const obj = {}
	const map = new Map()
	let hamt = HAMT.make()
	v.bench(`create: object`, () => {
		for (let i = 0; i < 1000; i++) {
			obj[i] = {}
		}
	})
	v.bench(`create: Map`, () => {
		for (let i = 0; i < 1000; i++) {
			map.set(i, new Map([[i, i]]))
		}
	})
	v.bench(`create: HAMT`, () => {
		for (let i = 0; i < 1000; i++) {
			hamt = hamt.set(i.toString(), HAMT.make())
		}
	})
})

v.describe(`remove a thousand members`, () => {
	let obj = {}
	const map = new Map()
	let hamt = HAMT.make()
	for (let i = 0; i < 1000; i++) {
		obj = { ...obj, [i]: i }
		map.set(i, new Map([[i, i]]))
	}
	v.bench(`removeFrom: object`, () => {
		for (let i = 0; i < 1000; i++) {
			delete obj[i]
		}
	})
	v.bench(`removeFrom: Map`, () => {
		for (let i = 0; i < 1000; i++) {
			map.delete(i)
		}
	})
	v.bench(`removeFrom: HAMT`, () => {
		for (let i = 0; i < 1000; i++) {
			hamt = hamt.delete(i.toString())
		}
	})
})

v.describe(`get a thousand members`, () => {
	let obj = {}
	const map = new Map()
	let hamt = HAMT.make()
	v.beforeAll(() => {
		for (let i = 0; i < 1000; i++) {
			obj = { ...obj, [i]: i }
			map.set(i, new Map([[i, i]]))
			hamt = hamt.set(i.toString(), HAMT.make())
		}
	})
	v.bench(`getFrom: object`, () => {
		for (let i = 0; i < 1000; i++) {
			obj[i]
		}
	})
	v.bench(`getFrom: Map`, () => {
		for (let i = 0; i < 1000; i++) {
			map.get(i)
		}
	})
	v.bench(`getFrom: HAMT`, () => {
		for (let i = 0; i < 1000; i++) {
			hamt.get(i.toString())
		}
	})
})

v.describe(`set a thousand members`, () => {
	let obj = {}
	const map = new Map()
	let hamt = HAMT.make()
	v.bench(`setInto: object`, () => {
		for (let i = 0; i < 1000; i++) {
			obj = { ...obj, [i]: i }
		}
	})
	v.bench(`setInto: Map`, () => {
		for (let i = 0; i < 1000; i++) {
			map.set(i, new Map([[i, i]]))
		}
	})
	v.bench(`setInto: HAMT`, () => {
		for (let i = 0; i < 1000; i++) {
			hamt = hamt.set(i.toString(), HAMT.make())
		}
	})
})

v.describe(`copy itself a thousand times`, () => {
	let obj = {}
	let map = new Map()
	let hamt = HAMT.make()
	for (let i = 0; i < 1000; i++) {
		obj[i] = i
		map.set(i, new Map([[i, i]]))
		hamt = hamt.set(i.toString(), HAMT.make())
	}
	v.bench(`copy: object`, () => {
		for (let i = 0; i < 1000; i++) {
			obj = { ...obj }
		}
	})
	v.bench(`copy: Map`, () => {
		for (let i = 0; i < 1000; i++) {
			map = new Map(map)
		}
	})
	v.bench(`copy: HAMT`, () => {
		for (let i = 0; i < 1000; i++) {
			hamt = hamt
		}
	})
})

v.describe(`reduce a thousand properties`, () => {
	const obj: Record<string, number> = {}
	const map = new Map()
	let hamt = HAMT.make<number, string>()
	for (let i = 0; i < 1000; i++) {
		obj[i] = i
		map.set(i, new Map([[i, i]]))
		hamt = hamt.set(i.toString(), i)
	}
	v.bench(`reduce: object`, () => {
		let sum = 0
		Object.values(obj).forEach((v) => (sum += v))
	})
	v.bench(`reduce: Map`, () => {
		let sum = 0
		map.forEach((v) => v.forEach((v) => (sum += v)))
	})
	v.bench(`reduce: HAMT`, () => {
		let sum = 0
		hamt.forEach((v) => (sum += v))
	})
})

v.describe(`serialize a thousand properties`, () => {
	const obj = {}
	const map = new Map()
	let hamt = HAMT.make()
	for (let i = 0; i < 1000; i++) {
		obj[i] = i
		map.set(i, i)
		hamt = hamt.set(i.toString(), i)
	}

	v.bench(`serialize: object`, () => {
		JSON.stringify(obj)
	})
	v.bench(`serialize: Map`, () => {
		JSON.stringify([...map.entries()])
	})
	v.bench(`serialize: HAMT`, () => {
		JSON.stringify([...hamt.entries()])
	})
})

v.describe(`deserialize a thousand properties`, () => {
	let obj = {}
	let map = new Map()
	let hamt = HAMT.make()

	for (let i = 0; i < 1000; i++) {
		obj[i] = i
		map.set(i, i)
		hamt = hamt.set(i.toString(), i)
	}
	const objStr = JSON.stringify(obj)
	const mapStr = JSON.stringify([...map.entries()])
	const hamtStr = JSON.stringify([...hamt.entries()])
	v.bench(`deserialize: object`, () => {
		obj = JSON.parse(objStr)
	})
	v.bench(`deserialize: Map`, () => {
		map = new Map(JSON.parse(mapStr))
	})
	v.bench(`deserialize: HAMT`, () => {
		const entries = JSON.parse(hamtStr)
		hamt = HAMT.mutate((h) => {
			for (const [k, v] of entries) {
				h.set(k, v)
			}
		}, HAMT.make())
	})
})

// Map
// create
// removeFrom
// setInto

// HAMT
// copy (no-op)

// object
// getFrom
// reduce
// serialize
// deserialize
