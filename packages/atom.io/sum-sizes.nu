def main [patterns: list<string>] {
    let matches = (
        $patterns
        | each {|p| glob $p }
        | flatten
        | uniq
    )

    let total = (
        $matches
        | each {|f|
            if ($f | path type) == "dir" {
                ls $"($f)/**" | where type == "file" | get size | math sum
            } else {
                ls $f | get size
            }
        }
        | math sum
    )

    print $"Total size: ($total | into filesize)"
}
