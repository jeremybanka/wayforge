# Register only this command and retain the user's existing completion provider.
# Keep the captured closure local so other autoload files cannot shadow it.
$env.config.completions.external.completer = do {
    let previous = $env.config.completions.external.completer
    {|place, buffer?|
        # Nu 0.116 binds named inputs; older Nu passes the command's token list.
        let spans = match $place { {command: $spans} => $spans, _ => $place }
        if ($spans | is-empty) { return [] }
        if (($spans.0 | path basename) == "COMMAND") {
            try { ^$spans.0 _comline nushell ...($spans | skip 1) | from json } catch { [] }
        } else if $previous != null {
            # Older Nu leaves the optional $buffer parameter unbound.
            if ($place | describe | str starts-with "list") {
                do $previous $spans
            } else {
                # Let Nu bind the previous provider's inputs in its declared order.
                # This scope restores our registration after the nested completion.
                do {
                    $env.config.completions.external.completer = $previous
                    $buffer | commandline complete --detailed
                }
            }
        } else { null }
    }
}
