#/bin/bash
# set -x
export ANSIBLE_HOST_KEY_CHECKING=False
DIR=$(dirname "$(readlink -f "$0")")

ENVIRONMENT="$1_hosts"
cd $DIR
echo "ENVIRONMENT $ENVIRONMENT"
echo "DIR $DIR"
ansible-playbook -i $DIR/../$ENVIRONMENT -u root  "$DIR/playbook/install_docker.yml"
ansible-playbook -i $DIR/../$ENVIRONMENT -u root  "$DIR/playbook/init_swarm_manager.yml"
ansible-playbook -i $DIR/../$ENVIRONMENT -u root  "$DIR/playbook/init_swarm_worker.yml"
ansible-playbook -i $DIR/../$ENVIRONMENT -u root  "$DIR/playbook/swarm_node_labels.yml"
