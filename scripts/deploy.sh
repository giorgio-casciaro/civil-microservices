#/bin/bash
# set -x
export ANSIBLE_HOST_KEY_CHECKING=False
DIR=$(dirname "$(readlink -f "$0")")

ENVIRONMENT="$1"
INVENTORY="$1_hosts"
cd $DIR/..

for dir in $DIR/../services/*
do
 serviceName=$(basename $dir)
 file="${dir}/config/docker-compose.$ENVIRONMENT.yml"
 # echo "CHECK: $file"
 if [ -f "$file" ]; then
  echo "ansible-playbook -i $DIR/../$INVENTORY -u root  $DIR/playbook/deploy_service.yml --extra-vars \"swarmfile=$file\""
  ansible-playbook -i "$DIR/../$INVENTORY" -u root  "$DIR/playbook/deploy_service.yml" --extra-vars "swarmfile=$file"
  fi
done
