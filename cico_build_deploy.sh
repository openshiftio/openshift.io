#!/bin/bash

REGISTRY="quay.io"
DEPLOY_CONT="wwwopenshiftio-deploy"
BUILDER_CONT="wwwopenshiftio-builder"

if [ "$TARGET" = "rhel" ]; then
  DOCKERFILE_DEPLOY="Dockerfile.deploy.rhel"
  REGISTRY_URL=${REGISTRY}/openshiftio/rhel-fabric8io-wwwopenshiftio
else
  DOCKERFILE_DEPLOY="Dockerfile.deploy"
  REGISTRY_URL=${REGISTRY}/openshiftio/fabric8io-wwwopenshiftio
fi

# Show command before executing
set -x

# Exit on error
set -e

# Export needed vars
set +x
eval "$(./env-toolkit load -f jenkins-env.json \
            BUILD_NUMBER \
            BUILD_URL \
            GIT_COMMIT \
            QUAY_USERNAME \
            QUAY_PASSWORD \
            DEVSHIFT_TAG_LEN)"
set -x

# We need to disable selinux for now, XXX
/usr/sbin/setenforce 0 || :

# Get all the deps in
yum -y install docker
yum clean all
service docker start

if [ ! -d dist ]; then
    mkdir dist

    # Build builder image
    docker build -t "${BUILDER_CONT}" -f Dockerfile.builder .

    # Clean builder container
    docker ps | grep -q "${BUILDER_CONT}" && docker stop "${BUILDER_CONT}"
    docker ps -a | grep -q "${BUILDER_CONT}" && docker rm "${BUILDER_CONT}"
    docker run --detach=true --name="${BUILDER_CONT}" -t \
        -v $(pwd)/dist:/dist:Z \
        -e BUILD_NUMBER -e BUILD_URL -e BUILD_TIMESTAMP \
        "${BUILDER_CONT}"

    # Build almigty-ui
    docker exec "${BUILDER_CONT}" npm install
    docker exec "${BUILDER_CONT}" npm run build:prod
    docker exec -u root "${BUILDER_CONT}" cp -r /home/fabric8/wwwopenshiftio/dist /
fi

if [ -n "${QUAY_USERNAME}" -a -n "${QUAY_PASSWORD}" ]; then
  docker login -u ${QUAY_USERNAME} -p ${QUAY_PASSWORD} ${REGISTRY}
else
  echo "Could not login, missing credentials for the registry"
  exit 1
fi

docker build -t "${DEPLOY_CONT}" -f "${DOCKERFILE_DEPLOY}" .

TAG=$(echo $GIT_COMMIT | cut -c1-${DEVSHIFT_TAG_LEN})

docker tag "${DEPLOY_CONT}" "${REGISTRY_URL}:$TAG"
docker push "${REGISTRY_URL}:$TAG"

docker tag "${DEPLOY_CONT}" "${REGISTRY_URL}:latest"
docker push "${REGISTRY_URL}:latest"
