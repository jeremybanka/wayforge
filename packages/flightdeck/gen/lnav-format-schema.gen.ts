import { z } from "zod";

export const lnavFormatSchema = z
	.object({
		regex: z
			.record(
				z.union([
					z
						.object({
							pattern: z
								.string()
								.min(1)
								.describe(
									"The regular expression to match a log message and capture fields.",
								)
								.optional(),
							"module-format": z
								.boolean()
								.describe(
									"If true, this pattern will only be used to parse message bodies of container formats, like syslog",
								)
								.optional(),
						})
						.strict()
						.describe("The set of patterns used to match log messages"),
					z.never(),
				]),
			)
			.superRefine((value, ctx) => {
				for (const key in value) {
					let evaluated = false;
					if (key.match(/^(.+)$/)) {
						evaluated = true;
						const result = z
							.object({
								pattern: z
									.string()
									.min(1)
									.describe(
										"The regular expression to match a log message and capture fields.",
									)
									.optional(),
								"module-format": z
									.boolean()
									.describe(
										"If true, this pattern will only be used to parse message bodies of container formats, like syslog",
									)
									.optional(),
							})
							.strict()
							.describe("The set of patterns used to match log messages")
							.safeParse(value[key]);
						if (!result.success) {
							ctx.addIssue({
								path: [...ctx.path, key],
								code: "custom",
								message: `Invalid input: Key matching regex /${key}/ must match schema`,
								params: {
									issues: result.error.issues,
								},
							});
						}
					}
					if (!evaluated) {
						const result = z.never().safeParse(value[key]);
						if (!result.success) {
							ctx.addIssue({
								path: [...ctx.path, key],
								code: "custom",
								message: "Invalid input: must match catchall schema",
								params: {
									issues: result.error.issues,
								},
							});
						}
					}
				}
			})
			.describe("The set of regular expressions used to match log messages")
			.optional(),
		json: z
			.boolean()
			.describe(
				'Indicates that log files are JSON-encoded (deprecated, use "file-type": "json")',
			)
			.optional(),
		"convert-to-local-time": z
			.boolean()
			.describe(
				"Indicates that displayed timestamps should automatically be converted to local time",
			)
			.optional(),
		"hide-extra": z
			.boolean()
			.describe(
				"Specifies whether extra values in JSON logs should be displayed",
			)
			.optional(),
		multiline: z
			.boolean()
			.describe("Indicates that log messages can span multiple lines")
			.optional(),
		"timestamp-divisor": z
			.union([
				z
					.number()
					.int()
					.describe(
						"The value to divide a numeric timestamp by in a JSON log.",
					),
				z
					.number()
					.describe(
						"The value to divide a numeric timestamp by in a JSON log.",
					),
			])
			.describe("The value to divide a numeric timestamp by in a JSON log.")
			.optional(),
		"file-pattern": z
			.string()
			.describe(
				"A regular expression that restricts this format to log files with a matching name",
			)
			.optional(),
		converter: z
			.object({
				type: z.string().describe("The MIME type").optional(),
				header: z
					.object({
						expr: z
							.record(
								z.union([z.string().describe("SQLite expression"), z.never()]),
							)
							.superRefine((value, ctx) => {
								for (const key in value) {
									let evaluated = false;
									if (key.match(/^(\w+)$/)) {
										evaluated = true;
										const result = z
											.string()
											.describe("SQLite expression")
											.safeParse(value[key]);
										if (!result.success) {
											ctx.addIssue({
												path: [...ctx.path, key],
												code: "custom",
												message: `Invalid input: Key matching regex /${key}/ must match schema`,
												params: {
													issues: result.error.issues,
												},
											});
										}
									}
									if (!evaluated) {
										const result = z.never().safeParse(value[key]);
										if (!result.success) {
											ctx.addIssue({
												path: [...ctx.path, key],
												code: "custom",
												message: "Invalid input: must match catchall schema",
												params: {
													issues: result.error.issues,
												},
											});
										}
									}
								}
							})
							.describe(
								"The expressions used to check if a file header matches this file format",
							)
							.optional(),
						size: z
							.number()
							.int()
							.describe("The minimum size required for this header type")
							.optional(),
					})
					.strict()
					.describe("File header detection definitions")
					.optional(),
				command: z
					.string()
					.regex(/[\w.-]+/)
					.describe("The script used to convert the file")
					.optional(),
			})
			.strict()
			.describe(
				"Describes how the file format can be detected and converted to a log that can be understood by lnav",
			)
			.optional(),
		"level-field": z
			.string()
			.describe("The name of the level field in the log message pattern")
			.optional(),
		"level-pointer": z
			.string()
			.describe(
				"A regular-expression that matches the JSON-pointer of the level property",
			)
			.optional(),
		"timestamp-field": z
			.string()
			.describe("The name of the timestamp field in the log message pattern")
			.optional(),
		"subsecond-field": z
			.string()
			.describe(
				"The path to the property in a JSON-lines log message that contains the sub-second time value",
			)
			.optional(),
		"subsecond-units": z
			.enum(["milli", "micro", "nano"])
			.describe("The units of the subsecond-field property value")
			.optional(),
		"time-field": z
			.string()
			.describe(
				"The name of the time field in the log message pattern.  This field should only be specified if the timestamp field only contains a date.",
			)
			.optional(),
		"body-field": z
			.string()
			.describe("The name of the body field in the log message pattern")
			.optional(),
		url: z
			.union([
				z
					.array(z.string())
					.describe("A URL with more information about this log format"),
				z
					.string()
					.describe("A URL with more information about this log format"),
			])
			.describe("A URL with more information about this log format")
			.optional(),
		title: z
			.string()
			.describe("The human-readable name for this log format")
			.optional(),
		description: z
			.string()
			.describe("A longer description of this log format")
			.optional(),
		"timestamp-format": z
			.array(z.string())
			.describe("An array of strptime(3)-like timestamp formats")
			.optional(),
		"module-field": z
			.string()
			.describe("The name of the module field in the log message pattern")
			.optional(),
		"opid-field": z
			.string()
			.describe("The name of the operation-id field in the log message pattern")
			.optional(),
		opid: z
			.object({
				subid: z
					.string()
					.describe("The field that holds the ID for a sub-operation")
					.optional(),
				description: z
					.record(
						z.union([
							z
								.object({
									format: z
										.array(
											z
												.object({
													field: z
														.string()
														.describe(
															"The field to include in the operation description",
														)
														.optional(),
													extractor: z
														.string()
														.describe(
															"The regex used to extract content for the operation description",
														)
														.optional(),
													prefix: z
														.string()
														.describe(
															"A string to prepend to this field in the description",
														)
														.optional(),
													suffix: z
														.string()
														.describe(
															"A string to append to this field in the description",
														)
														.optional(),
													joiner: z
														.string()
														.describe(
															"A string to insert between instances of this field when the field is found more than once",
														)
														.optional(),
												})
												.strict(),
										)
										.describe(
											"Defines the elements of this operation description",
										)
										.optional(),
								})
								.strict()
								.describe("A type of description for this operation"),
							z.never(),
						]),
					)
					.superRefine((value, ctx) => {
						for (const key in value) {
							let evaluated = false;
							if (key.match(/^([\w.-]+)$/)) {
								evaluated = true;
								const result = z
									.object({
										format: z
											.array(
												z
													.object({
														field: z
															.string()
															.describe(
																"The field to include in the operation description",
															)
															.optional(),
														extractor: z
															.string()
															.describe(
																"The regex used to extract content for the operation description",
															)
															.optional(),
														prefix: z
															.string()
															.describe(
																"A string to prepend to this field in the description",
															)
															.optional(),
														suffix: z
															.string()
															.describe(
																"A string to append to this field in the description",
															)
															.optional(),
														joiner: z
															.string()
															.describe(
																"A string to insert between instances of this field when the field is found more than once",
															)
															.optional(),
													})
													.strict(),
											)
											.describe(
												"Defines the elements of this operation description",
											)
											.optional(),
									})
									.strict()
									.describe("A type of description for this operation")
									.safeParse(value[key]);
								if (!result.success) {
									ctx.addIssue({
										path: [...ctx.path, key],
										code: "custom",
										message: `Invalid input: Key matching regex /${key}/ must match schema`,
										params: {
											issues: result.error.issues,
										},
									});
								}
							}
							if (!evaluated) {
								const result = z.never().safeParse(value[key]);
								if (!result.success) {
									ctx.addIssue({
										path: [...ctx.path, key],
										code: "custom",
										message: "Invalid input: must match catchall schema",
										params: {
											issues: result.error.issues,
										},
									});
								}
							}
						}
					})
					.describe("Define how to construct a description of an operation")
					.optional(),
				"sub-description": z
					.record(
						z.union([
							z
								.object({
									format: z
										.array(
											z
												.object({
													field: z
														.string()
														.describe(
															"The field to include in the operation description",
														)
														.optional(),
													extractor: z
														.string()
														.describe(
															"The regex used to extract content for the operation description",
														)
														.optional(),
													prefix: z
														.string()
														.describe(
															"A string to prepend to this field in the description",
														)
														.optional(),
													suffix: z
														.string()
														.describe(
															"A string to append to this field in the description",
														)
														.optional(),
													joiner: z
														.string()
														.describe(
															"A string to insert between instances of this field when the field is found more than once",
														)
														.optional(),
												})
												.strict(),
										)
										.describe(
											"Defines the elements of this operation description",
										)
										.optional(),
								})
								.strict()
								.describe("A type of description for this sub-operation"),
							z.never(),
						]),
					)
					.superRefine((value, ctx) => {
						for (const key in value) {
							let evaluated = false;
							if (key.match(/^([\w.-]+)$/)) {
								evaluated = true;
								const result = z
									.object({
										format: z
											.array(
												z
													.object({
														field: z
															.string()
															.describe(
																"The field to include in the operation description",
															)
															.optional(),
														extractor: z
															.string()
															.describe(
																"The regex used to extract content for the operation description",
															)
															.optional(),
														prefix: z
															.string()
															.describe(
																"A string to prepend to this field in the description",
															)
															.optional(),
														suffix: z
															.string()
															.describe(
																"A string to append to this field in the description",
															)
															.optional(),
														joiner: z
															.string()
															.describe(
																"A string to insert between instances of this field when the field is found more than once",
															)
															.optional(),
													})
													.strict(),
											)
											.describe(
												"Defines the elements of this operation description",
											)
											.optional(),
									})
									.strict()
									.describe("A type of description for this sub-operation")
									.safeParse(value[key]);
								if (!result.success) {
									ctx.addIssue({
										path: [...ctx.path, key],
										code: "custom",
										message: `Invalid input: Key matching regex /${key}/ must match schema`,
										params: {
											issues: result.error.issues,
										},
									});
								}
							}
							if (!evaluated) {
								const result = z.never().safeParse(value[key]);
								if (!result.success) {
									ctx.addIssue({
										path: [...ctx.path, key],
										code: "custom",
										message: "Invalid input: must match catchall schema",
										params: {
											issues: result.error.issues,
										},
									});
								}
							}
						}
					})
					.describe("Define how to construct a description of a sub-operation")
					.optional(),
			})
			.strict()
			.describe("Definitions related to operations found in logs")
			.optional(),
		"ordered-by-time": z
			.boolean()
			.describe(
				"Indicates that the order of messages in the file is time-based.",
			)
			.optional(),
		level: z
			.record(
				z.union([
					z
						.union([
							z
								.number()
								.int()
								.describe(
									"The regular expression used to match the log text for this level.  For JSON logs with numeric levels, this should be the number for the corresponding level.",
								),
							z
								.string()
								.describe(
									"The regular expression used to match the log text for this level.  For JSON logs with numeric levels, this should be the number for the corresponding level.",
								),
						])
						.describe(
							"The regular expression used to match the log text for this level.  For JSON logs with numeric levels, this should be the number for the corresponding level.",
						),
					z.never(),
				]),
			)
			.superRefine((value, ctx) => {
				for (const key in value) {
					let evaluated = false;
					if (
						key.match(
							/^(trace|debug[2345]?|info|stats|notice|warning|error|critical|fatal)$/,
						)
					) {
						evaluated = true;
						const result = z
							.union([
								z
									.number()
									.int()
									.describe(
										"The regular expression used to match the log text for this level.  For JSON logs with numeric levels, this should be the number for the corresponding level.",
									),
								z
									.string()
									.describe(
										"The regular expression used to match the log text for this level.  For JSON logs with numeric levels, this should be the number for the corresponding level.",
									),
							])
							.describe(
								"The regular expression used to match the log text for this level.  For JSON logs with numeric levels, this should be the number for the corresponding level.",
							)
							.safeParse(value[key]);
						if (!result.success) {
							ctx.addIssue({
								path: [...ctx.path, key],
								code: "custom",
								message: `Invalid input: Key matching regex /${key}/ must match schema`,
								params: {
									issues: result.error.issues,
								},
							});
						}
					}
					if (!evaluated) {
						const result = z.never().safeParse(value[key]);
						if (!result.success) {
							ctx.addIssue({
								path: [...ctx.path, key],
								code: "custom",
								message: "Invalid input: must match catchall schema",
								params: {
									issues: result.error.issues,
								},
							});
						}
					}
				}
			})
			.describe("The map of level names to patterns or integer values")
			.optional(),
		value: z
			.record(
				z.union([
					z
						.object({
							kind: z
								.enum([
									"string",
									"integer",
									"float",
									"boolean",
									"json",
									"struct",
									"quoted",
									"xml",
								])
								.describe("The type of data in the field")
								.optional(),
							collate: z
								.string()
								.describe("The collating function to use for this column")
								.optional(),
							unit: z
								.object({
									field: z
										.string()
										.describe(
											"The name of the field that contains the units for this field",
										)
										.optional(),
									"scaling-factor": z
										.record(
											z.union([
												z
													.object({
														op: z
															.enum(["identity", "multiply", "divide"])
															.optional(),
														value: z.number().optional(),
													})
													.strict(),
												z.never(),
											]),
										)
										.superRefine((value, ctx) => {
											for (const key in value) {
												let evaluated = false;
												if (key.match(/^(.+)$/)) {
													evaluated = true;
													const result = z
														.object({
															op: z
																.enum(["identity", "multiply", "divide"])
																.optional(),
															value: z.number().optional(),
														})
														.strict()
														.safeParse(value[key]);
													if (!result.success) {
														ctx.addIssue({
															path: [...ctx.path, key],
															code: "custom",
															message: `Invalid input: Key matching regex /${key}/ must match schema`,
															params: {
																issues: result.error.issues,
															},
														});
													}
												}
												if (!evaluated) {
													const result = z.never().safeParse(value[key]);
													if (!result.success) {
														ctx.addIssue({
															path: [...ctx.path, key],
															code: "custom",
															message: "Invalid input: must match catchall schema",
															params: {
																issues: result.error.issues,
															},
														});
													}
												}
											}
										})
										.describe(
											"Transforms the numeric value by the given factor",
										)
										.optional(),
								})
								.strict()
								.describe("Unit definitions for this field")
								.optional(),
							identifier: z
								.boolean()
								.describe(
									"Indicates whether or not this field contains an identifier that should be highlighted",
								)
								.optional(),
							"foreign-key": z
								.boolean()
								.describe(
									"Indicates whether or not this field should be treated as a foreign key for row in another table",
								)
								.optional(),
							hidden: z
								.boolean()
								.describe(
									"Indicates whether or not this field should be hidden",
								)
								.optional(),
							"action-list": z
								.array(z.string())
								.describe("Actions to execute when this field is clicked on")
								.optional(),
							rewriter: z
								.string()
								.describe(
									"A command that will rewrite this field when pretty-printing",
								)
								.optional(),
							description: z
								.string()
								.describe("A description of the field")
								.optional(),
						})
						.strict()
						.describe("The set of values captured by the log message patterns"),
					z.never(),
				]),
			)
			.superRefine((value, ctx) => {
				for (const key in value) {
					let evaluated = false;
					if (key.match(/^(.+)$/)) {
						evaluated = true;
						const result = z
							.object({
								kind: z
									.enum([
										"string",
										"integer",
										"float",
										"boolean",
										"json",
										"struct",
										"quoted",
										"xml",
									])
									.describe("The type of data in the field")
									.optional(),
								collate: z
									.string()
									.describe("The collating function to use for this column")
									.optional(),
								unit: z
									.object({
										field: z
											.string()
											.describe(
												"The name of the field that contains the units for this field",
											)
											.optional(),
										"scaling-factor": z
											.record(
												z.union([
													z
														.object({
															op: z
																.enum(["identity", "multiply", "divide"])
																.optional(),
															value: z.number().optional(),
														})
														.strict(),
													z.never(),
												]),
											)
											.superRefine((value, ctx) => {
												for (const key in value) {
													let evaluated = false;
													if (key.match(/^(.+)$/)) {
														evaluated = true;
														const result = z
															.object({
																op: z
																	.enum(["identity", "multiply", "divide"])
																	.optional(),
																value: z.number().optional(),
															})
															.strict()
															.safeParse(value[key]);
														if (!result.success) {
															ctx.addIssue({
																path: [...ctx.path, key],
																code: "custom",
																message: `Invalid input: Key matching regex /${key}/ must match schema`,
																params: {
																	issues: result.error.issues,
																},
															});
														}
													}
													if (!evaluated) {
														const result = z.never().safeParse(value[key]);
														if (!result.success) {
															ctx.addIssue({
																path: [...ctx.path, key],
																code: "custom",
																message: "Invalid input: must match catchall schema",
																params: {
																	issues: result.error.issues,
																},
															});
														}
													}
												}
											})
											.describe(
												"Transforms the numeric value by the given factor",
											)
											.optional(),
									})
									.strict()
									.describe("Unit definitions for this field")
									.optional(),
								identifier: z
									.boolean()
									.describe(
										"Indicates whether or not this field contains an identifier that should be highlighted",
									)
									.optional(),
								"foreign-key": z
									.boolean()
									.describe(
										"Indicates whether or not this field should be treated as a foreign key for row in another table",
									)
									.optional(),
								hidden: z
									.boolean()
									.describe(
										"Indicates whether or not this field should be hidden",
									)
									.optional(),
								"action-list": z
									.array(z.string())
									.describe("Actions to execute when this field is clicked on")
									.optional(),
								rewriter: z
									.string()
									.describe(
										"A command that will rewrite this field when pretty-printing",
									)
									.optional(),
								description: z
									.string()
									.describe("A description of the field")
									.optional(),
							})
							.strict()
							.describe(
								"The set of values captured by the log message patterns",
							)
							.safeParse(value[key]);
						if (!result.success) {
							ctx.addIssue({
								path: [...ctx.path, key],
								code: "custom",
								message: `Invalid input: Key matching regex /${key}/ must match schema`,
								params: {
									issues: result.error.issues,
								},
							});
						}
					}
					if (!evaluated) {
						const result = z.never().safeParse(value[key]);
						if (!result.success) {
							ctx.addIssue({
								path: [...ctx.path, key],
								code: "custom",
								message: "Invalid input: must match catchall schema",
								params: {
									issues: result.error.issues,
								},
							});
						}
					}
				}
			})
			.describe("The set of value definitions")
			.optional(),
		tags: z
			.record(
				z.union([
					z
						.object({
							paths: z
								.array(
									z
										.object({
											glob: z
												.string()
												.describe("The glob to match against file paths")
												.optional(),
										})
										.strict(),
								)
								.describe("Restrict tagging to the given paths")
								.optional(),
							pattern: z
								.string()
								.describe(
									"The regular expression to match against the body of the log message",
								)
								.optional(),
							description: z
								.string()
								.describe("A description of this tag")
								.optional(),
							level: z
								.enum([
									"trace",
									"debug5",
									"debug4",
									"debug3",
									"debug2",
									"debug",
									"info",
									"stats",
									"notice",
									"warning",
									"error",
									"critical",
									"fatal",
								])
								.describe("Constrain hits to log messages with this level")
								.optional(),
						})
						.strict()
						.describe("The name of the tag to apply"),
					z.never(),
				]),
			)
			.superRefine((value, ctx) => {
				for (const key in value) {
					let evaluated = false;
					if (key.match(/^([\w:;._-]+)$/)) {
						evaluated = true;
						const result = z
							.object({
								paths: z
									.array(
										z
											.object({
												glob: z
													.string()
													.describe("The glob to match against file paths")
													.optional(),
											})
											.strict(),
									)
									.describe("Restrict tagging to the given paths")
									.optional(),
								pattern: z
									.string()
									.describe(
										"The regular expression to match against the body of the log message",
									)
									.optional(),
								description: z
									.string()
									.describe("A description of this tag")
									.optional(),
								level: z
									.enum([
										"trace",
										"debug5",
										"debug4",
										"debug3",
										"debug2",
										"debug",
										"info",
										"stats",
										"notice",
										"warning",
										"error",
										"critical",
										"fatal",
									])
									.describe("Constrain hits to log messages with this level")
									.optional(),
							})
							.strict()
							.describe("The name of the tag to apply")
							.safeParse(value[key]);
						if (!result.success) {
							ctx.addIssue({
								path: [...ctx.path, key],
								code: "custom",
								message: `Invalid input: Key matching regex /${key}/ must match schema`,
								params: {
									issues: result.error.issues,
								},
							});
						}
					}
					if (!evaluated) {
						const result = z.never().safeParse(value[key]);
						if (!result.success) {
							ctx.addIssue({
								path: [...ctx.path, key],
								code: "custom",
								message: "Invalid input: must match catchall schema",
								params: {
									issues: result.error.issues,
								},
							});
						}
					}
				}
			})
			.describe("The tags to automatically apply to log messages")
			.optional(),
		partitions: z
			.record(
				z.union([
					z
						.object({
							paths: z
								.array(
									z
										.object({
											glob: z
												.string()
												.describe("The glob to match against file paths")
												.optional(),
										})
										.strict(),
								)
								.describe("Restrict partitioning to the given paths")
								.optional(),
							pattern: z
								.string()
								.describe(
									"The regular expression to match against the body of the log message",
								)
								.optional(),
							description: z
								.string()
								.describe("A description of this partition")
								.optional(),
							level: z
								.enum([
									"trace",
									"debug5",
									"debug4",
									"debug3",
									"debug2",
									"debug",
									"info",
									"stats",
									"notice",
									"warning",
									"error",
									"critical",
									"fatal",
								])
								.describe("Constrain hits to log messages with this level")
								.optional(),
						})
						.strict()
						.describe("The type of partition to apply"),
					z.never(),
				]),
			)
			.superRefine((value, ctx) => {
				for (const key in value) {
					let evaluated = false;
					if (key.match(/^([\w:;._-]+)$/)) {
						evaluated = true;
						const result = z
							.object({
								paths: z
									.array(
										z
											.object({
												glob: z
													.string()
													.describe("The glob to match against file paths")
													.optional(),
											})
											.strict(),
									)
									.describe("Restrict partitioning to the given paths")
									.optional(),
								pattern: z
									.string()
									.describe(
										"The regular expression to match against the body of the log message",
									)
									.optional(),
								description: z
									.string()
									.describe("A description of this partition")
									.optional(),
								level: z
									.enum([
										"trace",
										"debug5",
										"debug4",
										"debug3",
										"debug2",
										"debug",
										"info",
										"stats",
										"notice",
										"warning",
										"error",
										"critical",
										"fatal",
									])
									.describe("Constrain hits to log messages with this level")
									.optional(),
							})
							.strict()
							.describe("The type of partition to apply")
							.safeParse(value[key]);
						if (!result.success) {
							ctx.addIssue({
								path: [...ctx.path, key],
								code: "custom",
								message: `Invalid input: Key matching regex /${key}/ must match schema`,
								params: {
									issues: result.error.issues,
								},
							});
						}
					}
					if (!evaluated) {
						const result = z.never().safeParse(value[key]);
						if (!result.success) {
							ctx.addIssue({
								path: [...ctx.path, key],
								code: "custom",
								message: "Invalid input: must match catchall schema",
								params: {
									issues: result.error.issues,
								},
							});
						}
					}
				}
			})
			.describe("The partitions to automatically apply to log messages")
			.optional(),
		action: z
			.record(
				z.union([
					z.union([
						z.string(),
						z
							.object({
								label: z.string().optional(),
								"capture-output": z.boolean().optional(),
								cmd: z.array(z.string()).optional(),
							})
							.strict(),
					]),
					z.never(),
				]),
			)
			.superRefine((value, ctx) => {
				for (const key in value) {
					let evaluated = false;
					if (key.match(/^(\w+)$/)) {
						evaluated = true;
						const result = z
							.union([
								z.string(),
								z
									.object({
										label: z.string().optional(),
										"capture-output": z.boolean().optional(),
										cmd: z.array(z.string()).optional(),
									})
									.strict(),
							])
							.safeParse(value[key]);
						if (!result.success) {
							ctx.addIssue({
								path: [...ctx.path, key],
								code: "custom",
								message: `Invalid input: Key matching regex /${key}/ must match schema`,
								params: {
									issues: result.error.issues,
								},
							});
						}
					}
					if (!evaluated) {
						const result = z.never().safeParse(value[key]);
						if (!result.success) {
							ctx.addIssue({
								path: [...ctx.path, key],
								code: "custom",
								message: "Invalid input: must match catchall schema",
								params: {
									issues: result.error.issues,
								},
							});
						}
					}
				}
			})
			.optional(),
		sample: z
			.array(
				z
					.object({
						description: z
							.string()
							.describe("A description of this sample.")
							.optional(),
						line: z
							.string()
							.describe(
								"A sample log line that should match a pattern in this format.",
							)
							.optional(),
						level: z
							.enum([
								"trace",
								"debug5",
								"debug4",
								"debug3",
								"debug2",
								"debug",
								"info",
								"stats",
								"notice",
								"warning",
								"error",
								"critical",
								"fatal",
							])
							.describe("The expected level for this sample log line.")
							.optional(),
					})
					.strict(),
			)
			.describe(
				"An array of sample log messages to be tested against the log message patterns",
			)
			.optional(),
		"line-format": z
			.array(
				z.union([
					z.string(),
					z
						.object({
							field: z
								.string()
								.describe(
									"The name of the field to substitute at this position",
								)
								.optional(),
							"default-value": z
								.string()
								.describe(
									"The default value for this position if the field is null",
								)
								.optional(),
							"timestamp-format": z
								.string()
								.min(1)
								.describe("The strftime(3) format for this field")
								.optional(),
							"min-width": z
								.number()
								.int()
								.gte(0)
								.describe("The minimum width of the field")
								.optional(),
							"auto-width": z
								.boolean()
								.describe(
									"Automatically detect the necessary width of the field based on the observed values",
								)
								.optional(),
							"max-width": z
								.number()
								.int()
								.gte(0)
								.describe("The maximum width of the field")
								.optional(),
							align: z
								.enum(["left", "right"])
								.describe(
									"Align the text in the column to the left or right side",
								)
								.optional(),
							overflow: z
								.enum(["abbrev", "truncate", "dot-dot", "last-word"])
								.describe("Overflow style")
								.optional(),
							"text-transform": z
								.enum(["none", "uppercase", "lowercase", "capitalize"])
								.describe("Text transformation")
								.optional(),
							prefix: z
								.string()
								.describe("Text to prepend to the value")
								.optional(),
							suffix: z
								.string()
								.describe("Text to append to the value")
								.optional(),
						})
						.strict(),
				]),
			)
			.describe("The display format for JSON-encoded log messages")
			.optional(),
		"search-table": z
			.record(
				z.union([
					z
						.object({
							pattern: z
								.string()
								.describe("The regular expression for this search table.")
								.optional(),
							glob: z
								.string()
								.describe(
									"Glob pattern used to constrain hits to messages that match the given pattern.",
								)
								.optional(),
							level: z
								.enum([
									"trace",
									"debug5",
									"debug4",
									"debug3",
									"debug2",
									"debug",
									"info",
									"stats",
									"notice",
									"warning",
									"error",
									"critical",
									"fatal",
								])
								.describe("Constrain hits to log messages with this level")
								.optional(),
						})
						.strict()
						.describe("The set of search tables to be automatically defined"),
					z.never(),
				]),
			)
			.superRefine((value, ctx) => {
				for (const key in value) {
					let evaluated = false;
					if (key.match(/^(\w+)$/)) {
						evaluated = true;
						const result = z
							.object({
								pattern: z
									.string()
									.describe("The regular expression for this search table.")
									.optional(),
								glob: z
									.string()
									.describe(
										"Glob pattern used to constrain hits to messages that match the given pattern.",
									)
									.optional(),
								level: z
									.enum([
										"trace",
										"debug5",
										"debug4",
										"debug3",
										"debug2",
										"debug",
										"info",
										"stats",
										"notice",
										"warning",
										"error",
										"critical",
										"fatal",
									])
									.describe("Constrain hits to log messages with this level")
									.optional(),
							})
							.strict()
							.describe("The set of search tables to be automatically defined")
							.safeParse(value[key]);
						if (!result.success) {
							ctx.addIssue({
								path: [...ctx.path, key],
								code: "custom",
								message: `Invalid input: Key matching regex /${key}/ must match schema`,
								params: {
									issues: result.error.issues,
								},
							});
						}
					}
					if (!evaluated) {
						const result = z.never().safeParse(value[key]);
						if (!result.success) {
							ctx.addIssue({
								path: [...ctx.path, key],
								code: "custom",
								message: "Invalid input: must match catchall schema",
								params: {
									issues: result.error.issues,
								},
							});
						}
					}
				}
			})
			.describe("Search tables to automatically define for this log format")
			.optional(),
		highlights: z
			.record(
				z.union([
					z
						.object({
							pattern: z
								.string()
								.describe(
									"A regular expression to highlight in logs of this format.",
								)
								.optional(),
							color: z
								.string()
								.describe("The color to use when highlighting this pattern.")
								.optional(),
							"background-color": z
								.string()
								.describe(
									"The background color to use when highlighting this pattern.",
								)
								.optional(),
							underline: z
								.boolean()
								.describe("Highlight this pattern with an underline.")
								.optional(),
							blink: z
								.boolean()
								.describe("Highlight this pattern by blinking.")
								.optional(),
						})
						.strict()
						.describe("The definition of a highlight"),
					z.never(),
				]),
			)
			.superRefine((value, ctx) => {
				for (const key in value) {
					let evaluated = false;
					if (key.match(/^(.+)$/)) {
						evaluated = true;
						const result = z
							.object({
								pattern: z
									.string()
									.describe(
										"A regular expression to highlight in logs of this format.",
									)
									.optional(),
								color: z
									.string()
									.describe("The color to use when highlighting this pattern.")
									.optional(),
								"background-color": z
									.string()
									.describe(
										"The background color to use when highlighting this pattern.",
									)
									.optional(),
								underline: z
									.boolean()
									.describe("Highlight this pattern with an underline.")
									.optional(),
								blink: z
									.boolean()
									.describe("Highlight this pattern by blinking.")
									.optional(),
							})
							.strict()
							.describe("The definition of a highlight")
							.safeParse(value[key]);
						if (!result.success) {
							ctx.addIssue({
								path: [...ctx.path, key],
								code: "custom",
								message: `Invalid input: Key matching regex /${key}/ must match schema`,
								params: {
									issues: result.error.issues,
								},
							});
						}
					}
					if (!evaluated) {
						const result = z.never().safeParse(value[key]);
						if (!result.success) {
							ctx.addIssue({
								path: [...ctx.path, key],
								code: "custom",
								message: "Invalid input: must match catchall schema",
								params: {
									issues: result.error.issues,
								},
							});
						}
					}
				}
			})
			.describe("The set of highlight definitions")
			.optional(),
		"file-type": z
			.enum(["text", "json", "csv"])
			.describe("The type of file that contains the log messages")
			.optional(),
		"max-unrecognized-lines": z
			.number()
			.int()
			.gte(1)
			.describe(
				"The maximum number of lines in a file to use when detecting the format",
			)
			.optional(),
	})
	.strict()
	.describe("The definition of a log file format.");

export type LnavFormat = z.infer<typeof lnavFormatSchema>;
