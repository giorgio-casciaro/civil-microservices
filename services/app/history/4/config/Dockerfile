FROM giorgiocasciaro/ubuntu-node:v2
# RUN apt-get install -y libssl1.0.0 libssl-dev liblua5.1-dev
COPY ./package.json /microservice/package.json
COPY ./node_modules /microservice/node_modules
COPY ./service /microservice/service

WORKDIR  /microservice/
CMD ["sh","-c","'npm start'"]
