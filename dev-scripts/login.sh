#! /bin/bash
curl --header "Content-Type: application/json" --data '{"username": test-user, "password": "123"}' http://localhost:5000/api/auth/login
