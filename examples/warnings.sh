#!/bin/bash

# Usage:
# `./warnings.sh get` - get number of warnings 
# `./warnings.sh set 100` - set number of warnings to 100
#
# always expect exit code 0 when succeed

HEROKU_URL="https://your.herokuapp.com/"

SALT="abcde"
DATE="$(date +%s)"
APP="com.example.app"
SIGNATURE=$(echo -n "${SALT}${APP}${DATE}" | openssl dgst -sha256)

if [ X"$1" = X"get" ]; then
    OUTPUT=$(curl -X GET \
        "${HEROKU_URL}warning/${APP}" \
        -H "Signature: ${SIGNATURE}" \
        -H "Timestamp: ${DATE}" \
        --silent \
        --write-out \\n%{http_code})
    
    COUNT=$(echo -e $OUTPUT | cut -d " " -f 1)
    HTTP_CODE=$(echo -e $OUTPUT | cut -d " " -f 2)
    
    if [ "$HTTP_CODE" -eq "200" ]; then
        echo $COUNT
        exit 0
    fi
fi

if [ X"$1"=X"set" ] && [ -n "$2" ]; then
    OUTPUT=$(curl -X POST \
        "${HEROKU_URL}warning/${APP}" \
        -H "Signature: ${SIGNATURE}" \
        -H "Timestamp: ${DATE}" \
        -d count=$2 \
        --silent \
        --write-out \\n%{http_code})

    MSG=$(echo -e $OUTPUT | cut -d " " -f 1)
    HTTP_CODE=$(echo -e $OUTPUT | cut -d " " -f 2)
    
    if [ X"$MSG"=X"OK" ] && [ "$HTTP_CODE" -eq 200 ]; then
        exit 0
    fi
fi

exit 1