POST http://localhost:7676/
HTTP/1.1 200

[Asserts]    
jsonpath "$.message" == "POST request received"