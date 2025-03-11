#!/usr/bin/env bun

import { jsonSummaryFixture, reportFixture } from "../__tests__/report-fixture"

export default null

await fetch(`http://localhost:8787/reporter/thingy`, {
	method: `PUT`,
	headers: {
		Authorization: `Bearer ${import.meta.env.RECOVERAGE_CLOUD_TOKEN}`,
	},
	body: JSON.stringify({
		mapData: reportFixture,
		jsonSummary: jsonSummaryFixture,
	}),
})
