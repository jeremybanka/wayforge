set -l data "$HOME/.local/share"
if set -q XDG_DATA_HOME; and test -n "$XDG_DATA_HOME"
    set data "$XDG_DATA_HOME"
end
printf '\0completion-install\0ready\0%s\0' "$data/fish/vendor_completions.d"
printf '%s\0' $fish_complete_path
