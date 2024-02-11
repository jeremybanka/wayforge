# Adapted from the package scripts for AtomIO

- Removed hard-coded paths for root package (except changing the "package.json" export to null)
- Changed "atom.io" literals to "hamr"
- Directly learn submodule names in tsup.config.ts
- Remove root dts build mode