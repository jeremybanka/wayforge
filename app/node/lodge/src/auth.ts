import querystring from "querystring"
import { SERVER_ROOT_URI } from "./config"

const GOOGLE_OAUTH_URI = `auth/google`

export default function getGoogleAuthURL(): string {
  const rootUrl = `https://accounts.google.com/o/oauth2/v2/auth`
  const options = {
    redirect_uri: `${SERVER_ROOT_URI}/${GOOGLE_OAUTH_URI}`,
    client_id: process.env.GOOGLE_OAUTH_SECRET,
    access_type: `offline`,
    response_type: `code`,
    prompt: `consent`,
    scope: [
      `https://www.googleapis.com/auth/userinfo.profile`,
      `https://www.googleapis.com/auth/userinfo.email`,
    ].join(` `),
  }

  return `${rootUrl}?${querystring.stringify(options)}`
}
