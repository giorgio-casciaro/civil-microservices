FROM phusion/baseimage:0.9.22

ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update
RUN locale-gen en_US en_US.UTF-8
ENV LANG en_US.UTF-8

#To build AMC
RUN apt-get install -y build-essential python-dev python wget
# RUN sudo pip install markupsafe paramiko ecdsa pycrypto bcrypt

#AMC
RUN wget -O amc.deb http://www.aerospike.com/download/amc/4.0.13/artifact/ubuntu12 && \
    dpkg -i amc.deb && \
    rm amc.deb

COPY config/start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
