sudo apt-get -y update
# sudo apt-get -y upgrade
sudo apt install gdebi-core

wget https://packages.couchbase.com/releases/5.5.0/couchbase-server-community_5.5.0-ubuntu16.04_amd64.deb

sudo gdebi couchbase-server-enterprise_5.5.0-ubuntu16.04_amd64.deb

service couchbase-server status

sudo ufw allow from any to any port 369,8091:8094,9100:9105,9998,9999,11209:11211,11214,11215,18091:18093,21100:21299 proto tcp
