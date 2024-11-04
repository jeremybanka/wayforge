import { atom, getState, selector, setState } from "atom.io"
import type { Join, Tree, TreePath } from "treetrunks"
import { isTreePath, optional, required } from "treetrunks"

import { authAtom } from "./socket-auth-service"

export const ROUTES = required({
	login: null,
	sign_up: null,
	game: optional({
		clicker: null,
	}),
	admin: null,
}) satisfies Tree
export type Route = TreePath<typeof ROUTES>
export type Pathname = `/${Join<Route, `/`>}`

export function isRoute(route: unknown[]): route is Route {
	return isTreePath(ROUTES, route)
}

export const PUBLIC_ROUTES = [
	[`login`],
	[`sign_up`],
] as const satisfies TreePath<typeof ROUTES>[]
export type PublicRoute = (typeof PUBLIC_ROUTES)[number]
export type PublicPathname = `/${Join<PublicRoute, `/`>}`

function isPublicRoute(route: unknown[]): route is PublicRoute {
	return PUBLIC_ROUTES.some(
		(publicRoute) => publicRoute.join(`/`) === route.join(`/`),
	)
}

export function navigate(pathname: Pathname): void {
	history.pushState(null, ``, pathname)
	setState(pathnameAtom, pathname)
}

export const pathnameAtom = atom<Pathname | (string & {})>({
	key: `pathName`,
	default: window.location.pathname,
	effects: [
		({ onSet, setSelf }) => {
			const resolve = (pathname: Pathname) => {
				history.replaceState(null, ``, pathname)
				setSelf(pathname)
			}
			const redirect = (newValue: string) => {
				switch (newValue) {
					case `/`: {
						const auth = getState(authAtom)
						let destination: Pathname = `/login`
						if (auth) destination = `/game`
						resolve(destination)
						break
					}
					case `/login`:
					case `/sign_up`: {
						const auth = getState(authAtom)
						if (auth) resolve(`/game`)
					}
				}
			}
			redirect(window.location.pathname)
			onSet(({ newValue }) => {
				redirect(newValue)
			})
		},
		({ setSelf }) => {
			document.addEventListener(`click`, (e) => {
				const anchor = (e.target as HTMLElement).closest(`a`)
				if (anchor && anchor instanceof HTMLAnchorElement) {
					const url = anchor.getAttribute(`href`)
					if (url?.startsWith(`/`)) {
						e.preventDefault()
						history.pushState(null, ``, url)
						setSelf(url)
					}
				}
			})
			window.addEventListener(`popstate`, () => {
				setSelf(window.location.pathname)
			})
		},
	],
})

export const routeSelector = selector<Route | 401 | 404>({
	key: `route`,
	get: ({ get }) => {
		const pathname = get(pathnameAtom)
		const path = pathname.split(`/`).slice(1)
		const pathIsRoute = isRoute(path)
		if (!pathIsRoute) {
			return 404
		}
		if (isPublicRoute(path)) {
			return path
		}
		const auth = get(authAtom)
		if (!auth) {
			return 401
		}
		return path
	},
})
