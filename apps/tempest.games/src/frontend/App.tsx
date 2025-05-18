import {
	autoUpdate,
	flip,
	FloatingFocusManager,
	offset,
	shift,
	useClick,
	useDismiss,
	useFloating,
	useInteractions,
	useRole,
} from "@floating-ui/react"
import { setState } from "atom.io"
import { useO } from "atom.io/react"
import * as React from "react"

import { RESPONSE_DICTIONARY } from "../library/response-dictionary"
import * as svg from "./<svg>"
import { Anchor } from "./Anchor"
import scss from "./App.module.scss"
import { appVersionQueryAtom } from "./services/patchnotes-service"
import { navigate, routeSelector } from "./services/router-service"
import { authAtom, socket } from "./services/socket-auth-service"
import { trpcClient } from "./services/trpc-client-service"
import { Account } from "./views/Account"
import { Admin } from "./views/Admin"
import { GameView } from "./views/Game"
import { Home } from "./views/Home"
import { Verify } from "./views/Verify"

export function App(): React.ReactNode {
	const route = useO(routeSelector)
	const auth = useO(authAtom)

	const [accountPopOverIsOpen, setAccountPopOverOpen] = React.useState(false)
	const { refs, floatingStyles, context } = useFloating({
		open: accountPopOverIsOpen,
		onOpenChange: setAccountPopOverOpen,
		placement: `bottom-end`,
		middleware: [offset(5), flip(), shift()],
		whileElementsMounted: autoUpdate,
	})
	const click = useClick(context)
	const dismiss = useDismiss(context)
	const role = useRole(context)
	const { getReferenceProps, getFloatingProps } = useInteractions([
		click,
		dismiss,
		role,
	])

	const appVersion = useO(appVersionQueryAtom)

	return (
		<main className={scss[`class`]}>
			<header>
				<main>
					<svg.tempest />
					<span>
						v
						{appVersion instanceof Promise
							? `loading version`
							: appVersion.version}
					</span>
				</main>

				<button
					data-css="profile"
					ref={refs.setReference}
					{...getReferenceProps()}
				>
					{auth?.username ? auth.username.slice(0, 2) : ``}
				</button>
				{accountPopOverIsOpen && auth && (
					<FloatingFocusManager context={context} modal={false}>
						<div
							data-css="profile-actions"
							ref={refs.setFloating}
							style={floatingStyles}
							{...getFloatingProps()}
						>
							<span>{auth.username}</span>
							<button
								type="button"
								onClick={() => {
									navigate(`/account`)
								}}
							>
								Account
							</button>
							<button
								type="button"
								onClick={async () => {
									if (!auth) return
									await trpcClient.closeSession.mutate({
										username: auth.username,
										sessionKey: auth.sessionKey,
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
						</div>
					</FloatingFocusManager>
				)}
			</header>
			<main>
				{typeof route === `number` ? (
					<article>
						<h1>{route}</h1>
						<h2>{JSON.parse(RESPONSE_DICTIONARY[route])}</h2>
						<Anchor href="/">Return to Home Page</Anchor>
					</article>
				) : (
					(() => {
						switch (route[0]) {
							case undefined:
								return <Home />
							case `admin`:
								return <Admin />
							// case `sign_in`:
							// 	return <SignIn />
							// case `sign_up`:
							// 	return <SignUp />
							case `game`:
								return <GameView route={route} />
							case `verify`:
								return <Verify route={route} />
							case `account`:
								return <Account />
						}
					})()
				)}
			</main>
		</main>
	)
}
