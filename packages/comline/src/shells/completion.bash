# Decode shell quoting without evaluating substitutions or executing user input.
_comline_NAME_unquote() {
    local input=$1 char quote= escaped= i decoded rest escape
    local ansi_escape='^([0-7]{1,3}|x[[:xdigit:]]{1,2}|u[[:xdigit:]]{1,4}|U[[:xdigit:]]{1,8}|[abefnrtvE\\])'
    REPLY= REPLY_PREFIX=
    for ((i=0; i<${#input}; i++)); do
        char=${input:i:1}
        if [[ $quote == ansi ]]; then
            if [[ $char == "'" ]]; then
                quote=
            elif [[ $char == '\' ]]; then
                rest=${input:i+1}
                if [[ $rest =~ $ansi_escape ]]; then
                    escape=${BASH_REMATCH[0]}
                    printf -v decoded '%b' "\\$escape"
                    REPLY+=$decoded
                    ((i+=${#escape}))
                elif [[ ${rest:0:1} == [\"\'\?] ]]; then
                    REPLY+=${rest:0:1}
                    ((i++))
                else
                    REPLY+=$char
                fi
            else
                REPLY+=$char
            fi
        elif [[ $escaped ]]; then
            if [[ $quote == '"' && $char != [\$\`\"\\] ]]; then REPLY+='\'; fi
            REPLY+=$char; escaped=
        elif [[ $char == '\' && $quote != "'" ]]; then
            escaped=1
        elif [[ $quote ]]; then
            if [[ $char == "$quote" ]]; then quote=; else REPLY+=$char; fi
        elif [[ $char == '$' && ${input:i+1:1} == "'" ]]; then
            quote=ansi
            ((i++))
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
    local cur cword REPLY REPLY_PREFIX word executable response directive value prefix assignment= quote_candidates= file_candidates= i
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
    _comline_NAME_unquote "${words[0]}"
    executable=$REPLY
    response=$("$executable" _comline complete "${args[@]}" 2>/dev/null) || return
    [[ $response == prefix:*$'\n'* ]] || return
    assignment=${response%%$'\n'*}
    assignment=${assignment#prefix:}
    response=${response#*$'\n'}
    directive=${response##*$'\n'}
    [[ $directive == :* && ${directive#:} != *[!0-9]* && ${directive#:} ]] || return
    directive=${directive#:}
    ((directive & 1)) && return
    ((directive & 2)) && compopt -o nospace
    # File generators expect only the value, not the option assignment.
    [[ $assignment ]] && cur=${cur#*=}
    if ((directive & 16)); then
        _filedir -d
        file_candidates=1
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
        file_candidates=1
    fi
    for ((i=0; i<${#COMPREPLY[@]}; i++)); do
        value=${COMPREPLY[i]}
        # Readline cannot stat a path once an inline assignment is reattached.
        # Preserve directory continuation while the candidate is still a filename.
        if [[ $file_candidates && -d $value ]]; then
            [[ $value == */ ]] || value+=/
            compopt -o nospace
        fi
        value=$assignment$value
        value=${value#"$prefix"}
        if [[ $quote_candidates ]]; then printf -v value '%q' "$value"; fi
        COMPREPLY[i]=$value
    done
    return 0
}
# Bash dispatches by the literal command spelling, including surrounding quotes.
complete -F _comline_NAME COMMAND '"COMMAND"' "'COMMAND'"
