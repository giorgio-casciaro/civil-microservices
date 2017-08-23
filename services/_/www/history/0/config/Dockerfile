FROM nginx:1.12.0-alpine
RUN apk update && apk add bash
COPY ./service /usr/share/nginx/html
WORKDIR  /usr/share/nginx/html
