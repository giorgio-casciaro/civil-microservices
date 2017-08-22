FROM openjdk:8-jre-alpine
MAINTAINER kost, https://github.com/kost/docker-alpine
RUN apk add --update openssl bash
RUN wget -O /tmp/kibana.tar.gz https://artifacts.elastic.co/downloads/kibana/kibana-5.2.2-linux-x86_64.tar.gz
RUN wget -O /tmp/elasticsearch.tar.gz https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-5.2.2.tar.gz

RUN apk add --update nodejs

RUN mkdir -p /opt
RUN tar -xzf /tmp/elasticsearch.tar.gz -C /opt/
RUN ln -s /opt/elasticsearch-5.2.2 /opt/elasticsearch

RUN tar -xzf /tmp/kibana.tar.gz -C /opt/
RUN ln -s  /opt/kibana-5.2.2-linux-x86_64 /opt/kibana
RUN rm -r /opt/kibana/node/bin/
RUN mkdir -p /opt/kibana/node/bin/
RUN ln -s $(which node) /opt/kibana/node/bin/node

# RUN apk add --update mc curl

RUN addgroup -S elasticsearch && adduser -S -G elasticsearch elasticsearch
RUN mkdir /var/lib/nodes
RUN chown -R elasticsearch:elasticsearch /opt/  /usr/share  /var/lib

RUN  rm -rf /tmp/*.tar.gz /var/cache/apk/*

COPY config/kibana.yml /opt/kibana/config/kibana.yml
COPY scripts /scripts


USER elasticsearch
COPY config /opt/elasticsearch-5.2.2/config

ENTRYPOINT ["/scripts/start.sh"]
