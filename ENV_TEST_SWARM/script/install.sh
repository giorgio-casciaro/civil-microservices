# export NODE_IP=192.168.1.201
# export INTERNAL_IP=0.0.0.0
# export SERVERS="[\"192.168.1.201\", \"192.168.1.202\",\"192.168.1.203\"]"


# UPDATE
sudo apt-get update
sudo apt-get install -y  apt-transport-https  ca-certificates  curl  software-properties-common  unzip

# DOCKER
if [ ! -f "/vagrant/dockergpc" ]; then curl -sSL -o /vagrant/dockergpc https://download.docker.com/linux/ubuntu/gpg ; fi
sudo apt-key add /vagrant/dockergpc
sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
sudo apt-get update
sudo apt-get install -y docker-ce
sudo cat <<EOF >  /etc/docker/daemon.json
{"experimental":true}
EOF
#sudo systemctl restart docker

sudo systemctl enable docker
sudo systemctl start docker
# $IP=$(/sbin/ifconfig enp2s0 | grep 'inet addr:' | cut -d: -f2 | awk '{ print $1}')
# sudo docker swarm join --advertise-addr 192.168.1.211 --token $(cat /token/manager.tkn)
