import { http, HttpResponse } from "msw"

export const handlers = [
	// Mock the token exchange endpoint
	http.post(`https://github.com/login/oauth/access_token`, () => {
		return HttpResponse.json({
			access_token: `mocked-github-token`,
			token_type: `bearer`,
			scope: `user`,
		})
	}),

	// Mock the GitHub user API
	http.get(`https://api.github.com/user`, ({ request }) => {
		const authHeader = request.headers.get(`Authorization`)
		if (authHeader === `Bearer mocked-github-token`) {
			return HttpResponse.json({
				id: 12345,
				login: `testuser`,
				email: `testuser@example.com`,
			})
		}
		return new HttpResponse(null, { status: 401 })
	}),
]
