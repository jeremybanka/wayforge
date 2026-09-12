if ((BASH_VERSINFO[0] < 4)); then
    printf '\0completion-install\0Bash 4 or newer is required.\0'
elif ! declare -F _get_comp_words_by_ref >/dev/null || ! declare -F _filedir >/dev/null; then
    printf '\0completion-install\0Install bash-completion and enable it in your Bash configuration.\0'
elif ! shopt -q progcomp; then
    printf '\0completion-install\0Enable Bash programmable completion (shopt -s progcomp).\0'
else
    dirs=()
    if [[ -n ${BASH_COMPLETION_USER_DIR:-} ]]; then
        IFS=: read -r -a dirs <<< "$BASH_COMPLETION_USER_DIR"
    else
        dirs=("${XDG_DATA_HOME:-$HOME/.local/share}/bash-completion")
    fi
    printf '\0completion-install\0ready\0\0'
    for dir in "${dirs[@]}"; do
        [[ -n $dir ]] && printf '%s\0' "$dir/completions"
    done
fi

exit 0
