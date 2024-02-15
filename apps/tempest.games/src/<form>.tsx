export function welcome() {
	return (
		<form id="welcome">
			<button type="submit" class="primary" id="sign-up">
				Sign Up
			</button>
			<button
				type="submit"
				class="secondary"
				id="login"
				hx-get="/login"
				hx-select="#login"
				hx-swap="outerHTML"
			>
				Log In
			</button>
		</form>
	)
}

export function login() {
	return (
		<form id="login" hx-post="/login" hx-swap="outerHTML">
			<label for="username">Username</label>
			<input type="text" id="username" name="username" autocomplete="username" />
			<label for="password">Password</label>
			<input
				type="password"
				id="password"
				name="password"
				autocomplete="current-password"
			/>
			<button type="submit" class="primary">
				Log In
			</button>
		</form>
	)
}
