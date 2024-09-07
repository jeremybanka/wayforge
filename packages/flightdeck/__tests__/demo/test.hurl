GET http://localhost:4444

HTTP/1.1 200
[Asserts]
header "content-type" == "text/plain;charset=utf-8"
body == "Hello World!"