_comline_NAME() {
    local response directive line
    local -a request lines values descriptions spacing
    # Q removes lexical quotes; arrays preserve boundaries without eval.
    if ((CURRENT > 2)); then request=("${(@Q)words[2,CURRENT-1]}"); fi
    request+=("${(Q)PREFIX}")
    response=$("${(Q)words[1]}" __complete "${request[@]}" 2>/dev/null) || return
    lines=("${(@f)response}")
    directive=${lines[-1]#:}
    [[ ${lines[-1]} == :<-> ]] || return
    ((directive & 1)) && return
    lines[-1]=()
    [[ $PREFIX == -*=* ]] && compset -P 1 '*='
    ((directive & 2)) && spacing=(-S '')
    if ((directive & 16)); then
        _files -/
    elif ((${#lines})); then
        for line in "${lines[@]}"; do
            values+=("${line%%$'\t'*}")
            descriptions+=("${line//$'\t'/ -- }")
        done
        compadd "${spacing[@]}" -d descriptions -- "${values[@]}"
    elif ((! (directive & 4))); then
        _files
    fi
}
if (( $+functions[compdef] )); then compdef _comline_NAME COMMAND; fi
# An autoloaded completion must also perform the request on its first invocation.
if [[ $funcstack[1] == _COMMAND ]]; then _comline_NAME; fi
