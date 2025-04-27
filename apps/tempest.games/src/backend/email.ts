import { Resend } from "resend"

import { env } from "../library/env"

export const resend = new Resend(env.API_KEY_RESEND)
