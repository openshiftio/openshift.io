#!/bin/bash

REGISTRY="push.registry.devshift.net"
DEPLOY_CONT="wwwopenshiftio-deploy"
BUILDER_CONT="wwwopenshiftio-builder"

if [ "$TARGET" = "rhel" ]; then
  DOCKERFILE_DEPLOY="Dockerfile.deploy.rhel"
  REGISTRY_URL=${REGISTRY}/osio-prod/fabric8io/wwwopenshiftio
else
  DOCKERFILE_DEPLOY="Dockerfile.deploy"
  REGISTRY_URL=${REGISTRY}/fabric8io/wwwopenshiftio
fi

# Show command before executing
set -x

# Exit on error
set -e

# Export needed vars
set +x
for var in BUILD_NUMBER BUILD_URL GIT_COMMIT DEVSHIFT_USERNAME DEVSHIFT_PASSWORD DEVSHIFT_TAG_LEN; do
  export $(grep ${var} jenkins-env | xargs)
done
export BUILD_TIMESTAMP=`date -u +%Y-%m-%dT%H:%M:%S`+00:00
set -x

# We need to disable selinux for now, XXX
/usr/sbin/setenforce 0 || :

# Get all the deps in
yum -y install docker
yum clean all
service docker start

# Build builder image
docker build -t "${BUILDER_CONT}" -f Dockerfile.builder .

# Clean builder container
docker ps | grep -q "${BUILDER_CONT}" && docker stop "${BUILDER_CONT}"
docker ps -a | grep -q "${BUILDER_CONT}" && docker rm "${BUILDER_CONT}"

mkdir -p dist && docker run --detach=true --name="${BUILDER_CONT}" -t -v $(pwd)/dist:/dist:Z -e BUILD_NUMBER -e BUILD_URL -e BUILD_TIMESTAMP "${BUILDER_CONT}"

# Build almigty-ui
docker exec "${BUILDER_CONT}" npm install
docker exec "${BUILDER_CONT}" npm run build:prod
docker exec -u root "${BUILDER_CONT}" cp -r /home/fabric8/wwwopenshiftio/dist /

if [ -n "${DEVSHIFT_USERNAME}" -a -n "${DEVSHIFT_PASSWORD}" ]; then
  docker login -u ${DEVSHIFT_USERNAME} -p ${DEVSHIFT_PASSWORD} ${REGISTRY}
else
  echo "Could not login, missing credentials for the registry"
fi

docker build -t "${DEPLOY_CONT}" -f "${DOCKERFILE_DEPLOY}" .

TAG=$(echo $GIT_COMMIT | cut -c1-${DEVSHIFT_TAG_LEN})

docker tag "${DEPLOY_CONT}" "${REGISTRY_URL}:$TAG"
docker push "${REGISTRY_URL}:$TAG"

docker tag "${DEPLOY_CONT}" "${REGISTRY_URL}:latest"
docker push "${REGISTRY_URL}:latest"
