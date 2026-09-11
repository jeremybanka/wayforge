let preferred = $nu.data-dir | path join vendor autoload
let status = if not $env.config.completions.external.enable {
    "Nushell external completions are disabled. Enable $env.config.completions.external.enable before installing."
} else if $preferred not-in $nu.vendor-autoload-dirs {
    "Nushell's user vendor directory is not in $nu.vendor-autoload-dirs."
} else { "ready" }
print -n (["" completion-install $status $preferred] | append $nu.vendor-autoload-dirs | append $nu.user-autoload-dirs | append "" | str join (char nul))
