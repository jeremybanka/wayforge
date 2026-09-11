# Register only this command and retain the user's existing completion provider.
# Keep the captured closure local so other autoload files cannot shadow it.
$env.config.completions.external.completer = do {
    let previous = $env.config.completions.external.completer
    {|spans|
        if ($spans | is-empty) { return [] }
        if (($spans.0 | path basename) == "COMMAND") {
            try { ^$spans.0 _comline nushell ...($spans | skip 1) | from json } catch { [] }
        } else if $previous != null {
            do $previous $spans
        } else { null }
    }
}
