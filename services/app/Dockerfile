FROM giorgiocasciaro/ubuntu-node:v1
# RUN apt-get install -y libssl1.0.0 libssl-dev liblua5.1-dev 
COPY . /service
WORKDIR  /service
ENTRYPOINT ["sh","-c","'npm start'"]
