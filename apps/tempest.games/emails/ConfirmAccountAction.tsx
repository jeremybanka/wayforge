import {
	Body,
	CodeBlock,
	Container,
	Head,
	Heading,
	Html,
	Preview,
	Section,
	Text,
} from "@react-email/components"
import * as React from "react"

import {
	genAccountActionCode,
	summarizeAccountAction,
} from "../src/backend/account-actions"
import * as svg from "../src/frontend/<svg>"

// biome-ignore lint/style/noNonNullAssertion: <explanation>
const FRONTEND_ORIGIN = JSON.parse(process.env[`FRONTEND_ORIGINS`]!)[0] ?? ``

interface ConfirmEmailProps {
	subjectInternal: string
	summary: string
	oneTimeCode: string
	baseUrl?: string
}

function ConfirmAccountAction({
	subjectInternal: subject,
	summary,
	oneTimeCode,
	baseUrl = FRONTEND_ORIGIN,
}: ConfirmEmailProps): React.ReactNode {
	const url = new URL(baseUrl)
	const prettyLink = `${url.host}/verify`
	return (
		<Html>
			<Head>
				<style>
					{`
					body {
						--logo-color: #055 !important;
						--bg-color: #ccc2aa !important;
						--fg-color: #055 !important;
						--fg-soft: #255 !important;
						--fg-faint: #533355 !important;
						--fg-hyperlink: #02e !important;
					}
          // @media (prefers-color-scheme: dark) {
          //   body {
					// 		--logo-color: #ddd200 !important;
          //     --bg-color: #111 !important;
          //     --fg-color: #fff200 !important;
					// 		--fg-soft: #ccc200 !important;
					// 		--fg-faint: #777200 !important;
					// 		--fg-hyperlink: #00f2ff !important;
          //   }
          }
        `}
				</style>
			</Head>
			<Body style={main}>
				<Preview>{summary}</Preview>
				<Container style={container}>
					<Section style={logoContainer}>
						<svg.tempest width="250" />
					</Section>
					<Heading style={h1}>{subject}</Heading>
					<Text style={heroText}>{summary}</Text>

					<Section style={codeBox}>
						<CodeBlock
							style={confirmationCodeText}
							code={oneTimeCode}
							language="properties"
							theme={{}}
						/>
					</Section>

					<Text style={heroText}>
						Paste the code above into your browser window at{` `}
						<a href={`${baseUrl}/verify`} style={footerLink}>
							{prettyLink}
						</a>
						.
					</Text>

					<Text style={text}>This code will expire in 15 minutes.</Text>
					<Text style={text}>
						If you didn't request this email, you can safely ignore it.
					</Text>

					<Section style={footerLogos}>
						<Text style={footerText}>
							@2025 Tempest Games, LLC
							<br />
							<br />
							ISC License
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	)
}

const PREVIEW_CODE_ONLY = genAccountActionCode()

ConfirmAccountAction.PreviewProps = {
	...summarizeAccountAction({
		username: `tiny_dog`,
		oneTimeCode: PREVIEW_CODE_ONLY,
		action: `confirmEmail`,
	}),
	oneTimeCode: PREVIEW_CODE_ONLY,
	baseUrl: `https://tempest.games`,
}

export default ConfirmAccountAction

const footerText = {
	fontSize: `12px`,
	color: `var(--fg-soft)`,
	lineHeight: `15px`,
	textAlign: `left` as const,
	marginBottom: `50px`,
}

const footerLink = {
	color: `var(--fg-hyperlink)`,
	textDecoration: `underline`,
}

const footerLogos = {
	marginBottom: `32px`,
	paddingLeft: `8px`,
	paddingRight: `8px`,
	display: `block`,
}

const socialMediaIcon = {
	display: `inline`,
	marginLeft: `32px`,
}

const main = {
	backgroundColor: `var(--bg-color)`,
	margin: `0 auto`,
	fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`,
}

const container = {
	margin: `0 auto`,
	padding: `0px 20px`,
}

const logoContainer = {
	marginTop: `32px`,
}

const h1 = {
	color: `var(--fg-color)`,
	fontSize: `36px`,
	fontWeight: `700`,
	margin: `30px 0`,
	padding: `0`,
	lineHeight: `42px`,
}

const heroText = {
	color: `var(--fg-color)`,
	fontSize: `20px`,
	lineHeight: `28px`,
	marginBottom: `30px`,
}

const codeBox = {
	color: `var(--bg-color)`,
	background: `var(--fg-faint)`,
	borderRadius: `4px`,
	marginBottom: `30px`,
	padding: `40px 10px`,
}

const confirmationCodeText = {
	fontSize: `30px`,
	textAlign: `center` as const,
	verticalAlign: `middle`,
	font: `monospace`,
}

const text = {
	color: `var(--fg-color)`,
	fontSize: `14px`,
	lineHeight: `24px`,
}
