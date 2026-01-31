import { atom, getState, selector, setState } from "atom.io"
import type { Join, Tree, TreePath } from "treetrunks"
import { isTreePath, optional } from "treetrunks"

import { authAtom } from "./socket-auth-service"

export const ROUTES = optional({
	verify: optional({
		$token: null,
	}),
	game: optional({
		carbiter: null,
		hexiom: null,
		server_control: null,
	}),
	account: null,
	admin: null,
}) satisfies Tree
export type Route = TreePath<typeof ROUTES>
export type Pathname = `/${Join<Route, `/`>}`

export function isRoute(route: unknown[]): route is Route {
	return isTreePath(ROUTES, route)
}

export const PUBLIC_ROUTES = [[]] as const satisfies TreePath<typeof ROUTES>[]
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
	key: `pathname`,
	default: window.location.pathname,
	effects: [
		({ onSet, setSelf }) => {
			const resolve = (pathname: Pathname) => {
				history.replaceState(null, ``, pathname)
				setSelf(pathname)
			}
			const redirect = (newValue: Pathname | (string & {})) => {
				switch (newValue) {
					case `/`: {
						const auth = getState(authAtom)
						console.log(`/`, `auth`, auth)
						switch (auth?.verification) {
							case `verified`:
								resolve(`/game`)
								break
							case `unverified`:
								resolve(`/verify`)
								break
							case undefined:
						}
						break
					}
					case `/verify`: {
						const auth = getState(authAtom)
						if (auth?.verification === `verified`) {
							resolve(`/game`)
						}
						break
					}
					case `/game`:
					case `/game/carbiter`:
					case `/game/hexiom`:
					case `/game/server_control`: {
						const auth = getState(authAtom)
						if (auth?.verification === `unverified`) {
							resolve(`/verify`)
						}
						break
					}
					case `/admin`:
						break
					case `/account`: {
						const auth = getState(authAtom)
						if (!auth) {
							resolve(`/`)
							break
						}
						if (auth.verification === `unverified`) {
							resolve(`/verify`)
						}
						break
					}
					default:
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
		const path = pathname.split(`/`).slice(1).filter(Boolean)
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
