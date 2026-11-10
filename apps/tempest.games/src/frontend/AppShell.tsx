import type { Children } from "@atom.io/spa"
import { onCleanup, onMount, useGetter, useId, useSetter } from "@atom.io/spa"
import type { Middleware } from "@floating-ui/dom"
import { flip, offset, shift } from "@floating-ui/dom"
import { atomFamily, disposeState, setState } from "atom.io"
import { IMPLICIT } from "atom.io/internal"

import { RESPONSE_DICTIONARY } from "../library/response-dictionary"
import * as svg from "./<svg>"
import css from "./AppShell.module.css"
import { VersionSpinner } from "./components/VersionSpinner"
import { appVersionSelector } from "./services/patchnotes-service"
import { navigate, routeSelector } from "./services/router-service"
import {
	authAtom,
	connectionErrorAtom,
	socket,
} from "./services/socket-auth-service"
import { trpcClient } from "./services/trpc-client-service"
import { AccountView } from "./views/AccountView"
import { AdminView } from "./views/AdminView"
import { GameView } from "./views/GameView"
import { HomeView } from "./views/HomeView"
import { VerifyView } from "./views/VerifyView"

IMPLICIT.STORE.loggers[0].logLevel = `warn`

const accountPopoverOpenAtoms = atomFamily<boolean, string>({
	key: `accountPopoverOpen`,
	default: false,
})

export function AppShell(): Children {
	const route = useGetter(routeSelector)
	const auth = useGetter(authAtom)
	const connectionError = useGetter(connectionErrorAtom)

	const instanceKey = useId()
	const accountPopOverIsOpen = useGetter(accountPopoverOpenAtoms, instanceKey)
	const setAccountPopOverOpen = useSetter(accountPopoverOpenAtoms, instanceKey)
	onCleanup(() => {
		disposeState(accountPopoverOpenAtoms, instanceKey)
	})
	let profileButton: HTMLButtonElement | null = null
	let profileActions: HTMLElement | null = null
	let focusObserver: MutationObserver | undefined
	onCleanup(() => {
		focusObserver?.disconnect()
	})
	const profileMiddleware: Middleware[] = [
		offset(5),
		flip(),
		shift(),
		{
			name: `devicePixels`,
			fn: ({ x, y }) => {
				const dpr = window.devicePixelRatio
				return {
					x: Math.round(x * dpr) / dpr,
					y: Math.round(y * dpr) / dpr,
				}
			},
		},
	]
	onMount(() => {
		const dismiss = (event: PointerEvent) => {
			if (
				event.target instanceof Node &&
				!profileActions?.contains(event.target) &&
				!profileButton?.contains(event.target)
			)
				setAccountPopOverOpen(false)
		}
		const escape = (event: KeyboardEvent) => {
			if (event.key === `Escape` && accountPopOverIsOpen()) {
				setAccountPopOverOpen(false)
				profileButton?.focus()
			}
		}
		document.addEventListener(`pointerdown`, dismiss)
		document.addEventListener(`keydown`, escape)
		onCleanup(() => {
			document.removeEventListener(`pointerdown`, dismiss)
			document.removeEventListener(`keydown`, escape)
		})
	})

	const appVersion = useGetter(appVersionSelector)

	const isGameRoute = () => {
		const current = route()
		return typeof current === `object` && current[0] === `game`
	}
	const renderRoute = () => {
		const current = route()
		if (typeof current === `number`)
			return (
				<article>
					<h1>{current}</h1>
					<h2>{JSON.parse(RESPONSE_DICTIONARY[current])}</h2>
					<a href="/">Return to Home Page</a>
				</article>
			)
		switch (current[0]) {
			case undefined:
				return <HomeView />
			case `admin`:
				return <AdminView />
			case `game`:
				return <GameView key={current.join(`/`)} route={current} />
			case `verify`:
				return <VerifyView key={current.join(`/`)} route={current} />
			case `account`:
				return <AccountView />
		}
	}

	return (
		<app-shell className={css.class}>
			<app-layout>
				<header>
					<brand-lockup>
						{isGameRoute() ? null : <svg.tempest />}
						<span>
							<VersionSpinner input={appVersion()} />
						</span>
					</brand-lockup>

					<button
						data-css="profile"
						ref={(element) => {
							profileButton = element
						}}
						aria-haspopup="dialog"
						aria-expanded={accountPopOverIsOpen()}
						onClick={() => {
							setAccountPopOverOpen((open) => !open)
						}}
					>
						{auth()?.username ? auth()?.username?.slice(0, 3) : ``}
					</button>
					{accountPopOverIsOpen() && auth() && (
						<profile-popover>
							<profile-actions
								floating:reference={profileButton}
								floating:placement="bottom-end"
								floating:middleware={profileMiddleware}
								ref={(element) => {
									focusObserver?.disconnect()
									focusObserver = undefined
									profileActions = element
									if (element) {
										// Floating UI reveals the overlay after its first calculation.
										const focusFirstAction = () => {
											if (
												!element.isConnected ||
												getComputedStyle(element).visibility === `hidden`
											)
												return
											element.querySelector(`button`)?.focus()
											focusObserver?.disconnect()
											focusObserver = undefined
										}
										focusObserver = new MutationObserver(focusFirstAction)
										focusObserver.observe(element, {
											attributes: true,
											attributeFilter: [`style`],
										})
										queueMicrotask(focusFirstAction)
									}
								}}
								role="dialog"
								aria-label="Account"
								onFocusOut={(event) => {
									if (
										event.relatedTarget instanceof Node &&
										!event.currentTarget.contains(event.relatedTarget) &&
										event.relatedTarget !== profileButton
									)
										setAccountPopOverOpen(false)
								}}
							>
								<span>{auth()?.username}</span>
								<button
									type="button"
									onClick={() => {
										navigate(`/account`)
										setAccountPopOverOpen(false)
									}}
								>
									Account
								</button>
								<button
									type="button"
									onClick={async () => {
										if (!auth()) return
										await trpcClient.closeSession.mutate({
											username: auth()!.username,
										})
										socket.once(`disconnect`, () => {
											setState(authAtom, null)
											navigate(`/`)
										})
										socket.disconnect()
									}}
								>
									Sign out
								</button>
							</profile-actions>
						</profile-popover>
					)}
				</header>
				<main>{renderRoute()}</main>
			</app-layout>
			{connectionError() ? (
				<aside>
					<connection-dialog>
						<h1>Disconnected</h1>
						<button type="button" onClick={() => socket.connect()}>
							Reconnect
						</button>
					</connection-dialog>
				</aside>
			) : null}
		</app-shell>
	)
}
