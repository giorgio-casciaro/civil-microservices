FROM giorgiocasciaro/ubuntu-node:v2
COPY ./docker/scripts /scripts
COPY . /service
RUN rm -r /service/node_modules
RUN ls /service
RUN mv /service/node_modules_compiled /service/node_modules
WORKDIR  /service
ENTRYPOINT ["/scripts/start.sh"]
# ENTRYPOINT ["bash"]
