import { env } from "cloudflare:test"
import { XMLParser } from "fast-xml-parser"
import { createCoverageMap } from "istanbul-lib-coverage"
import {
	downloadCoverageReportFromCloud,
	uploadCoverageReportToCloud,
} from "recoverage/lib"

import app from "../src"
import { GITHUB_CALLBACK_ENDPOINT } from "../src/env"
import { jsonSummaryFixture, reportFixture } from "./report-fixture"

afterEach(() => {
	vi.restoreAllMocks()
})

test(`authentication flow`, async () => {
	vi.spyOn(globalThis, `fetch`).mockImplementation(async (input, init) => {
		await Promise.resolve()
		const request = new Request(input, init)
		const url = new URL(request.url)

		console.log(`[intercepted]`, request.method, url.origin + url.pathname)

		switch (`${request.method} ${url.origin}${url.pathname}`) {
			case `GET https://github.com/login/oauth/authorize`: {
				const redirectUrl = new URL(GITHUB_CALLBACK_ENDPOINT, `http://localhost`)
				redirectUrl.searchParams.set(`code`, `mocked-github-token`)
				return app.request(
					redirectUrl.pathname + redirectUrl.search,
					{ method: `GET` },
					env,
				)
			}
			case `GET https://github.com/login/oauth/access_token`:
				return new Response(`access_token=gho_fake&scope=user&token_type=bearer`)
			case `GET https://api.github.com/user`:
				return Response.json({
					id: 12345,
					login: `testuser`,
					email: `testuser@example.com`,
				})

			default:
				// handle with the worker
				return app.request(input, init, env)
		}
	})

	const response = await app.request(`/`, { method: `GET` }, env)
	expect(response.status).toBe(200)

	const authRes = await fetch(`https://github.com/login/oauth/authorize`)
	const githubAccessTokenCookie = authRes.headers.get(`set-cookie`)

	assert(githubAccessTokenCookie)

	const response2 = await fetch(`https://recoverage.cloud/`, {
		method: `GET`,
		headers: {
			Cookie: githubAccessTokenCookie,
		},
	})
	expect(response2.status).toBe(200)

	const project = await fetch(`https://recoverage.cloud/ui/project`, {
		method: `POST`,
		headers: {
			Cookie: githubAccessTokenCookie,
			"Content-Type": `application/x-www-form-urlencoded`,
		},
		body: `name=test`,
	})
	const projectText = await project.text()

	const hxPost = projectText.match(/hx-post="([^"]+)"/)
	const postTokenToProjectPath = hxPost?.[1]
	assert(postTokenToProjectPath)
	const postTokenToProjectUrl = new URL(
		postTokenToProjectPath,
		`https://recoverage.cloud`,
	)
	console.log({ postTokenToProjectUrl: postTokenToProjectPath })
	const projectId = postTokenToProjectPath.split(`/`)[3]

	console.log({ projectId })

	const token = await fetch(postTokenToProjectUrl, {
		method: `POST`,
		headers: {
			Cookie: githubAccessTokenCookie,
			"Content-Type": `application/x-www-form-urlencoded`,
		},
		body: `name=test`,
	})

	const tokenText = await token.text()
	const parser = new XMLParser()
	const tokenXml = parser.parse(tokenText)
	const code = tokenXml.div.div[0].span.code
	console.log({ code })
	assert(code)

	const reportRef = `atom.io`
	const reportMissing = await fetch(
		`https://recoverage.cloud/reporter/${reportRef}`,
		{
			method: `GET`,
			headers: {
				Authorization: `Bearer ${code}`,
			},
		},
	)
	console.log(await reportMissing.json())
	expect(reportMissing.status).toBe(404)

	const reportMissingLib = await downloadCoverageReportFromCloud(reportRef, code)
	expect(reportMissingLib).toBeInstanceOf(Error)

	const reportPut = await fetch(
		`https://recoverage.cloud/reporter/${reportRef}`,
		{
			method: `PUT`,
			headers: {
				Authorization: `Bearer ${code}`,
			},
			body: JSON.stringify({
				mapData: reportFixture,
				jsonSummary: jsonSummaryFixture,
			}),
		},
	)
	const reportPutJson = await reportPut.json()
	console.log({ reportPutJson })
	expect(reportPut.status).toBe(200)
	const reportPutLibJson = await uploadCoverageReportToCloud(
		reportRef,
		createCoverageMap(reportFixture),
		jsonSummaryFixture,
		code,
	)
	expect(reportPutLibJson).toEqual(reportPutJson)

	const reportGet = await fetch(
		`https://recoverage.cloud/reporter/${reportRef}`,
		{
			method: `GET`,
			headers: {
				Authorization: `Bearer ${code}`,
			},
		},
	)
	expect(reportGet.status).toBe(200)
	const reportGetJson = await reportGet.json()
	expect(reportGetJson).toEqual(reportFixture)
	const reportGetLib = await downloadCoverageReportFromCloud(reportRef, code)
	assert(typeof reportGetLib === `string`)
	expect(JSON.parse(reportGetLib)).toEqual(reportFixture)
})
