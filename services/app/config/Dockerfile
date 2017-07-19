FROM giorgiocasciaro/ubuntu-node:v2
# RUN apt-get install -y libssl1.0.0 libssl-dev liblua5.1-dev
COPY . /microservice
WORKDIR  /microservice/service
ENTRYPOINT ["sh","-c","'npm start'"]
