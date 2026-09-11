# Decode shell quoting without evaluating substitutions or executing user input.
_comline_NAME_unquote() {
    local input=$1 char quote= escaped= i
    REPLY= REPLY_PREFIX=
    for ((i=0; i<${#input}; i++)); do
        char=${input:i:1}
        if [[ $escaped ]]; then
            if [[ $quote == '"' && $char != [\$\`\"\\] ]]; then REPLY+='\'; fi
            REPLY+=$char; escaped=
        elif [[ $char == '\' && $quote != "'" ]]; then
            escaped=1
        elif [[ $quote ]]; then
            if [[ $char == "$quote" ]]; then quote=; else REPLY+=$char; fi
        elif [[ $char == "'" || $char == '"' ]]; then
            quote=$char
        else
            REPLY+=$char
            # Readline replaces only the segment after an unquoted word break.
            if [[ $char == [=:] && $COMP_WORDBREAKS == *"$char"* ]]; then
                REPLY_PREFIX=$REPLY
            fi
        fi
    done
    [[ $escaped ]] && REPLY+='\'
    return 0
}

_comline_NAME() {
    local cur cword REPLY REPLY_PREFIX word response directive value prefix assignment= quote_candidates= i
    local -a words args
    COMPREPLY=()
    # bash-completion rejoins word breaks such as --flag=value and host:path.
    _get_comp_words_by_ref -n =: cur words cword || return
    words[cword]=$cur
    for word in "${words[@]:1:cword}"; do
        _comline_NAME_unquote "$word"
        args+=("$REPLY")
    done
    prefix=$REPLY_PREFIX
    [[ $REPLY == -*=* ]] && assignment=${REPLY%%=*}=
    response=$("${words[0]}" __complete "${args[@]}" 2>/dev/null) || return
    directive=${response##*$'\n'}
    [[ $directive == :* && ${directive#:} != *[!0-9]* && ${directive#:} ]] || return
    directive=${directive#:}
    ((directive & 1)) && return
    ((directive & 2)) && compopt -o nospace
    # File generators expect only the value, not the option assignment.
    [[ $assignment ]] && cur=${cur#*=}
    if ((directive & 16)); then
        _filedir -d
    elif [[ $response == *$'\n'* ]]; then
        # Quote candidate values ourselves so characters such as $ and ` remain
        # literal when Readline inserts them, including for non-file candidates.
        compopt -o noquote
        quote_candidates=1
        while IFS= read -r value; do
            COMPREPLY+=("${value%%$'\t'*}")
        done <<< "${response%$'\n'*}"
    elif ((! (directive & 4))); then
        _filedir
    fi
    for ((i=0; i<${#COMPREPLY[@]}; i++)); do
        value=$assignment${COMPREPLY[i]}
        value=${value#"$prefix"}
        if [[ $quote_candidates ]]; then printf -v value '%q' "$value"; fi
        COMPREPLY[i]=$value
    done
    return 0
}
complete -F _comline_NAME COMMAND
