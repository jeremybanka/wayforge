---
"comline": patch
---

Support explicitly declared config-only options with schema-validated values such as callbacks, dates, and scalars while preserving inferred callback signatures and the existing type constraints on CLI options. Config-only fields stay out of help and completion, and attempts to supply them through argv fail before configuration loading.

Export `ConfigInput` for typed authored configuration, accept runtime schemas without JSON Schema conversion, and allow typed per-option schemas to preserve CLI metadata independently of the full configuration. CLI hints remain usable when metadata conversion is unavailable. Validate merged configuration from its original input so defaults and transformations produce the parsed output correctly. Full configuration schema export reports unsupported conversion instead of substituting CLI metadata or silently approximating unsupported Arktype values.
