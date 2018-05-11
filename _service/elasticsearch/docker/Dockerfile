FROM openjdk:8-jre-alpine
MAINTAINER kost, https://github.com/kost/docker-alpine
RUN apk add --update openssl bash
RUN wget -O /tmp/elasticsearch.tar.gz https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-5.2.2.tar.gz


RUN mkdir -p /opt
RUN tar -xzf /tmp/elasticsearch.tar.gz -C /opt/
RUN ln -s /opt/elasticsearch-5.2.2 /opt/elasticsearch

# RUN apk add --update mc curl

RUN addgroup -S elasticsearch && adduser -S -G elasticsearch elasticsearch
RUN mkdir /var/lib/nodes
RUN chown -R elasticsearch:elasticsearch /opt/  /usr/share  /var/lib

RUN  rm -rf /tmp/*.tar.gz /var/cache/apk/*


USER elasticsearch
#COPY config /opt/esConfigs
ENV ES_JAVA_OPTS="-Xms256m -Xmx256m"
# RUN echo "/opt/elasticsearch/bin/elasticsearch -Ees.config=/opt/esConfigs/$config.yml"
# ENTRYPOINT /opt/elasticsearch/bin/elasticsearch -Epath.conf=/opt/esConfigs/$config/ -Epath.scripts=/opt/elasticsearch/config/scripts
ENTRYPOINT /opt/elasticsearch/bin/elasticsearch
