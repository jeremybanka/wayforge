function __comline_NAME
    set -l words (commandline -opc)
    set -l request
    for word in $words
        set -a request (string unescape -- "$word")
    end
    set -l current (string unescape -- (commandline -ct))
    if not set -q current[1]; set current ''; end
    set -l response (command $request[1] _comline complete $request[2..] "$current" 2>/dev/null)
    or return
    string match -q 'prefix:*' -- "$response[1]"; or return
    set -l prefix (string replace -r '^prefix:' '' -- "$response[1]")
    if not set -q prefix[1]; set prefix ''; end
    set response $response[2..]
    string match -qr '^:[0-9]+$' -- "$response[-1]"; or return
    set -l directive (string sub -s 2 -- "$response[-1]")
    test (math "$directive % 2") -eq 0; or return
    set -l candidates $response[1..-2]
    if test -n "$prefix"
        set current (string sub -s (math (string length -- "$prefix") + 1) -- "$current")
    end
    if test (math "floor($directive / 16) % 2") -eq 1
        set candidates (__fish_complete_directories "$current")
    else if test (count $candidates) -eq 0; and test (math "floor($directive / 4) % 2") -eq 0
        set candidates (__fish_complete_path "$current")
    end
    for candidate in $candidates
        if test -z "$prefix$candidate"
            # A blank command-substitution line disappears. An empty description
            # field keeps the candidate present so Fish can quote the empty value.
            # Fish 3 needs existing quotes (or --option=); Fish 4 adds them itself.
            printf '\t\n'
        else
            printf '%s%s\n' "$prefix" "$candidate"
        end
    end
    # Fish's completion API has no arbitrary no-space flag. Preserve the exact
    # candidate set and let Fish apply its native punctuation/spacing rules.
end
complete -c COMMAND -e
complete -c COMMAND -f -a '(__comline_NAME)'
