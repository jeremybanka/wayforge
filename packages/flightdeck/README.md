# flightdeck

lightweight process manager and updater for Node.js applications.

## flightdeck's cycle
- install an application
- spawn a process running the application
- await a web hook that says "a new version is ready!"
- download the new version
- tell the application process that an update is ready
- await the running process saying "ready to update"
- kill the running process and restart it
- install the new version
- spawn a process running the new version
