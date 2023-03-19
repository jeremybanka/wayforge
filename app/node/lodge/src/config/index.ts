export const SERVER_PORT_WS = 5000
export const SERVER_PORT_HTTP = 4000
export const CLIENT_PORT = 3000

export const ENV_IS_DEV = process.env.NODE_ENV === `development`

export const SERVER_ROOT_URI = ENV_IS_DEV
  ? `http://localhost:${SERVER_PORT_HTTP}`
  : `https://www.tempest.games:${SERVER_PORT_HTTP}`
