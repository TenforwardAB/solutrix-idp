#! /bin/bash
TOKEN=$(curl --silent --header "Content-Type: application/json" --data '{"username": "spock", "password": "qwerty123!"}' http://localhost:5000/api/auth/login | jq -r '.access.token')

# Register using the stored token
curl --header "Authorization: Bearer $TOKEN" --header "Content-Type: application/json" --data '{"username": "filip", "password": "filip123", "email": "filip.windahl@tsei.se", "customerid": "5e44f2e0-26d0-423e-9b79-740806abc7cc"}' http://localhost:5000/api/auth/register
