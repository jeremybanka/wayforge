"""Exercise the actual line editor: send Tab, execute the result, read CLI output.

Requires a Unix PTY. Never sources the user's startup files.
"""
import errno
import fcntl
import json
import os
import pty
import select
import signal
import struct
import sys
import time
import termios

shell, setup, output, line = sys.argv[1:]
ready_file = output + ".ready"
if shell == "bash":
    completion = os.environ.get("BASH_COMPLETION_FILE", "/usr/share/bash-completion/bash_completion")
    init = f"source '{completion}'; source '{setup}'; touch '{ready_file}'\n"
elif shell == "zsh":
    init = f"autoload -Uz compinit; compinit -D; source '{setup}'; touch '{ready_file}'\n"
else:
    init = f"source '{setup}'; touch '{ready_file}'\n"
startup = output + ".rc"
with open(startup, "w") as file:
    file.write(init)
pid, fd = pty.fork()
if pid == 0:
    os.environ["TERM"] = "xterm-256color"
    os.environ["COMLINE_TEST_OUTPUT"] = output
    if shell == "bash":
        args = [shell, "--noprofile", "--rcfile", startup, "-i"]
    elif shell == "zsh":
        os.environ["ZDOTDIR"] = output + ".zsh"
        os.mkdir(os.environ["ZDOTDIR"])
        with open(os.path.join(os.environ["ZDOTDIR"], ".zshrc"), "w") as file:
            file.write(init)
        args = [shell, "-i"]
    elif shell == "fish":
        args = [shell, "--no-config", "--interactive", "--init-command", init]
    else:
        args = [shell, "--no-config-file", "--no-history", "--execute", init]
    os.execvp(shell, args)

fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", 24, 160, 0, 0))
transcript = bytearray()
def wait_for(predicate, timeout=5):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if predicate():
            return
        ready, _, _ = select.select([fd], [], [], 0.05)
        if ready:
            try:
                chunk = os.read(fd, 65536)
                if not chunk:
                    break
                transcript.extend(chunk)
                # Nushell asks the terminal for its cursor position.
                if b"\x1b[6n" in chunk:
                    os.write(fd, b"\x1b[1;1R")
                if b"\x1b[0c" in chunk:
                    os.write(fd, b"\x1b[?1;2c")
            except OSError as error:
                if error.errno != errno.EIO:
                    raise
                break
    raise RuntimeError(transcript.decode(errors="replace"))

try:
    # Run setup through each shell's startup mechanism so terminal negotiation
    # cannot consume setup commands as responses to capability queries.
    wait_for(lambda: os.path.exists(ready_file))
    os.write(fd, line.encode())
    os.write(fd, b"\n")
    wait_for(lambda: os.path.exists(output) and os.path.getsize(output) > 0)
    with open(output) as result:
        print(result.read().strip())
finally:
    os.kill(pid, signal.SIGKILL)
    os.waitpid(pid, 0)
    os.close(fd)
