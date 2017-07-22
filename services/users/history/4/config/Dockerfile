FROM giorgiocasciaro/ubuntu-node:v2
COPY . /microservice
WORKDIR  /microservice/service
RUN mkdir /uploads
RUN chmod 777 /uploads
CMD ["sh","-c","'npm start'"]
# ENTRYPOINT ["bash"]
