function __comline_NAME
    set -l words (commandline -opc)
    set -l request
    for word in $words
        set -a request (string unescape -- "$word")
    end
    set -l current (string unescape -- (commandline -ct))
    if not set -q current[1]; set current ''; end
    set -l response (command $request[1] __complete $request[2..] "$current" 2>/dev/null)
    or return
    string match -qr '^:[0-9]+$' -- "$response[-1]"; or return
    set -l directive (string sub -s 2 -- "$response[-1]")
    test (math "$directive % 2") -eq 0; or return
    set -l candidates $response[1..-2]
    set -l prefix ''
    if string match -qr '^-[^=]*=' -- "$current"
        set prefix (string replace -r '=.*$' '=' -- "$current")
        set current (string replace -r '^[^=]*=' '' -- "$current")
    end
    if test (math "floor($directive / 16) % 2") -eq 1
        set candidates (__fish_complete_directories "$current")
    else if test (count $candidates) -eq 0; and test (math "floor($directive / 4) % 2") -eq 0
        set candidates (__fish_complete_path "$current")
    end
    for candidate in $candidates
        printf '%s%s\n' "$prefix" "$candidate"
    end
    # Fish suppresses a trailing space for an ambiguous common prefix.
    # Use that behavior when a sole candidate requests no space and has no
    # punctuation suffix for which Fish already suppresses the space.
    if test (count $candidates) -eq 1; and test (math "floor($directive / 2) % 2") -eq 1
        set -l value (string split -m 1 \t -- "$candidates[1]")[1]
        if not string match -qr '[@=/:.,]$' -- "$value"
            printf '%s%s.\n' "$prefix" "$value"
        end
    end
end
complete -c COMMAND -e
complete -c COMMAND -f -a '(__comline_NAME)'
