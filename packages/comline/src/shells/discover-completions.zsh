if (( ! $+functions[compdef] )); then
    printf '\0completion-install\0Enable Zsh completion with autoload -Uz compinit; compinit in your shell configuration.\0'
else
    # Match compinit's security checks instead of installing into ignored paths.
    autoload -Uz compaudit
    insecure=("${(@f)$(compaudit 2>/dev/null)}")
    printf '\0completion-install\0ready\0\0'
    for dir in "${fpath[@]}"; do
        safe=1
        for bad in "${insecure[@]}"; do
            if [[ -n $bad && ($dir == "$bad" || $dir == "$bad"/*) ]]; then safe=0; fi
        done
        ((safe)) && printf '%s\0' "$dir"
    done
fi

exit 0
