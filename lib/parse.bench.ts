import * as v from "vitest"

v.describe(`comparing Array.split to JSON.parse`, () => {
	const str = `a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y`
	v.bench(`Array.split`, () => {
		str.split(`,`)
	})
	v.bench(`JSON.parse`, () => {
		JSON.parse(`["${str}"]`)
	})
})

const elements = `1,`.repeat(10000).slice(0, -1)

v.describe(`10000 elements`, () => {
	v.bench(`Array.split`, () => {
		elements.split(`,`)
	})
	v.bench(`JSON.parse`, () => {
		JSON.parse(`["${elements}"]`)
	})
})

v.describe(`comparing Array.join to JSON.stringify`, () => {
	const arr = Array.from({ length: 10000 }, (_, i) => i)
	v.bench(`join`, () => {
		arr.join(`,`)
	})
	v.bench(`JSON.stringify`, () => {
		JSON.stringify(arr)
	})
})
