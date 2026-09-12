_comline_NAME() {
    local response directive line prefix
    local -a request lines values descriptions empty_description spacing
    # Q removes lexical quotes; arrays preserve boundaries without eval.
    if ((CURRENT > 2)); then request=("${(@Q)words[2,CURRENT-1]}"); fi
    request+=("${(Q)PREFIX}")
    response=$("${(Q)words[1]}" _comline complete "${request[@]}" 2>/dev/null) || return
    lines=("${(@f)response}")
    [[ ${lines[1]} == prefix:* ]] || return
    prefix=${lines[1]#prefix:}
    lines[1]=()
    directive=${lines[-1]#:}
    [[ ${lines[-1]} == :<-> ]] || return
    ((directive & 1)) && return
    lines[-1]=()
    [[ -n $prefix ]] && compset -P "${(b)prefix}"
    ((directive & 2)) && spacing=(-S '')
    if ((directive & 16)); then
        _files -/
    elif ((${#lines})); then
        for line in "${lines[@]}"; do
            if [[ -z ${line%%$'\t'*} ]]; then
                # An empty insertion is not an argument. Insert literal shell quotes.
                empty_description=("${line//$'\t'/ -- }")
                compadd "${spacing[@]}" -Q -d empty_description -- "''"
                continue
            fi
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
