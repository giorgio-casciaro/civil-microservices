#/bin/bash
#/
DIR=$(dirname "$(readlink -f "$0")")
cd $DIR/..

# while true; do sleep 60; wget -q http://127.0.0.1:10080/api/app/getPublicApiSchema -O ./www/webpack/src/api.schema.json; done &
xdg-open https://127.0.0.1/api_static/app/
xdg-open http://127.0.0.1:8025/
cd services/www/webpack
npm run dev
cd ../../..
