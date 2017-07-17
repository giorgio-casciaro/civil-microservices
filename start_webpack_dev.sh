#/bin/bash

# while true; do sleep 60; wget -q http://127.0.0.1:10080/api/app/getPublicApiSchema -O ./www/webpack/src/api.schema.json; done &
xdg-open http://127.0.0.1:81/api_static/app
cd services/www/webpack
npm run dev
cd ../../..
