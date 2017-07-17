FROM phusion/baseimage:0.9.22
RUN curl -sL https://deb.nodesource.com/setup_7.x | bash -\
&& apt-get install -y nodejs && apt-get clean

COPY ./docker/scripts /scripts
RUN apt-get update && apt-get install -y build-essential
RUN apt-get install -y python
RUN apt-get install -y libssl1.0.0 libssl-dev liblua5.1-dev
RUN ln -s /usr/lib/x86_64-linux-gnu/liblua5.1.so /usr/lib/liblua.so
RUN ln -s /usr/lib/x86_64-linux-gnu/liblua5.1.a /usr/lib/liblua.a
COPY ./service /service
WORKDIR  /service/
ENTRYPOINT ["sh","/scripts/start.sh"]
# ENTRYPOINT ["bash"]
