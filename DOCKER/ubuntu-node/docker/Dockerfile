FROM phusion/baseimage:0.9.22

RUN curl -sL https://deb.nodesource.com/setup_7.x | bash -\
&& apt-get install -y nodejs \
&& apt-get clean

ENTRYPOINT ["bash"]
#&& apt-get install -y libssl1.0.0 libssl-dev liblua5.1-dev \
