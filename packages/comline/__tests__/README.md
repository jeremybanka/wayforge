# Assertion boundaries

Classify each assertion, including assertions in helpers and setup, by what its failure means:

| Bucket       | Location                 | Failure means                                                                           |
| ------------ | ------------------------ | --------------------------------------------------------------------------------------- |
| Contract     | `public/`                | Consumers lost supported behavior.                                                      |
| Questionable | `private/`               | An internal preference changed; we reserve the right to change it without notice.       |
| Baggage      | Remove only after review | The assertion checks nothing useful that another operation has not already established. |

A test can contain both contract and questionable assertions. Give it separate public and private halves, sharing setup through `fixtures/` where useful. Keep every useful assertion in one half. If an exact assertion combines a contract with an incidental constraint, retain it privately and add a narrower public assertion. Fixtures may return observations or project fields; they should not hide private assertions inside a public test run.

For extensible records, project the fields consumers use. `inputValues` preserves the case, positional path, and exact schema-validated option map. `optionOccurrences` preserves occurrence count, argument order, canonical values, and source indexes. `candidateValues` compares membership without ranking; `candidateSpacing` compares effective spacing, including result-level defaults. Supplied descriptions still need their own checks.

Keep exact help snapshots, English diagnostic sentences, ANSI palettes, generator-byte comparisons, internal factory/cache call counts, and known upstream limitation probes private. Public tests check usable help and schemas, rejection, safe and meaningful warnings, installed completion behavior, file preservation, and supported callbacks. Calls to user providers, parsers, validators, or loggers can be contractual; internal call counts usually are not. Honor explicit documented promises, including shared-schema metadata reads and completion-target identity.

When splitting, preserve parameter rows, meaningful setup operations embedded inside `expect(...)`, and cleanup. Run both directories and compare source coverage with the pre-split baseline. Also run `public/` on its own to verify that it does not depend on the private half.

Name each half for what its assertions actually check. For example, public completion tests check candidate membership and effective spacing; their private counterparts name declaration order, exact record shapes, or explicit spacing fields. A private error-message test should name the wording it pins instead of claiming to test file preservation or completion behavior.

Keep shared definitions and parameter tables in the corresponding `fixtures/*-cases.ts` module. Factories create fresh mutable CLI definitions and spies, so paired suites can reuse a scenario without sharing execution state. A helper may prepare files, render output, or drive a shell; its name should describe that operation, and the assertions should remain visible in the test. Keep Vitest's hoisted module mocks in the test file that owns the mock boundary. Prefer a local setup block when a helper would only hide a few obvious lines.

Use `test.each` for equivalent operations with different inputs, including schema implementations, invocation prefixes, and completion-management words. Give each row a useful failure name. Preserve every existing row when consolidating a table; checking the same source lines does not establish that two inputs catch the same regression.

The integration matrices have distinct purposes:

| Matrix                                             | Protection                                                                                                                                                       |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Real shell consumers                               | Each adapter has its own quoting, escaping, spacing, cursor handling, and native completion discovery. Keep the applicable cases for each consumer.              |
| Installed Node package and compiled Bun executable | The installed package runs the full behavior matrix. The compiled executable separately checks embedded scripts, discovery, execution, and runtime independence. |
| Launchers and invocation prefixes                  | Runtimes and launchers supply different argument prefixes and delimiters. Each row checks the arguments that actually reach the CLI.                             |
| Public and private observations                    | A shared scenario can protect a consumer contract publicly and pin wording, ordering, or bytes privately. Both halves must run independently.                    |

Run `pnpm --filter comline lint:types` to check both projects. The package's `tsconfig.json` validates declarations for published source; this directory's `tsconfig.json` checks tests and fixtures while preserving inferred schema and route types. The fixture-only lint exception permits inferred return types without relaxing checks on the published API.
