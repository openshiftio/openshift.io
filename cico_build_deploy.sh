#!/bin/bash

# Show command before executing
set -x

# Exit on error
set -e

# Export needed vars
for var in BUILD_NUMBER BUILD_URL GIT_COMMIT DEVSHIFT_USERNAME DEVSHIFT_PASSWORD; do
  export $(grep ${var} jenkins-env | xargs)
done
export BUILD_TIMESTAMP=`date -u +%Y-%m-%dT%H:%M:%S`+00:00

# We need to disable selinux for now, XXX
/usr/sbin/setenforce 0

# Get all the deps in
yum -y install docker
yum clean all
service docker start

# Build builder image
docker build -t wwwopenshiftio-builder -f Dockerfile.builder .
mkdir -p dist && docker run --detach=true --name=wwwopenshiftio-builder -t -v $(pwd)/dist:/dist:Z -e BUILD_NUMBER -e BUILD_URL -e BUILD_TIMESTAMP wwwopenshiftio-builder

# Build almigty-ui
docker exec wwwopenshiftio-builder npm install

## Exec unit tests
#docker exec wwwopenshiftio-builder ./run_unit_tests.sh

#if [ $? -eq 0 ]; then
#  echo 'CICO: unit tests OK'
#else
#  echo 'CICO: unit tests FAIL'
#  exit 1
#fi

## Exec functional tests
#docker exec wwwopenshiftio-builder ./run_functional_tests.sh

#if [ $? -eq 0 ]; then
#  echo 'CICO: functional tests OK'
  docker exec wwwopenshiftio-builder npm run build:prod
  docker exec -u root wwwopenshiftio-builder cp -r /home/fabric8/wwwopenshiftio/dist /
  ## All ok, deploy
#  if [ $? -eq 0 ]; then
#    echo 'CICO: build OK'
    docker build -t wwwopenshiftio-deploy -f Dockerfile.deploy . && \

    TAG=$(echo $GIT_COMMIT | cut -c1-6)
    REGISTRY="push.registry.devshift.net"

    docker login -u ${DEVSHIFT_USERNAME} -p ${DEVSHIFT_PASSWORD} ${REGISTRY}

    docker tag wwwopenshiftio-deploy ${REGISTRY}/fabric8io/wwwopenshiftio:$TAG && \
    docker push ${REGISTRY}/fabric8io/wwwopenshiftio:$TAG && \
    docker tag wwwopenshiftio-deploy ${REGISTRY}/fabric8io/wwwopenshiftio:latest && \
    docker push ${REGISTRY}/fabric8io/wwwopenshiftio:latest
    if [ $? -eq 0 ]; then
      echo 'CICO: image pushed, ready to update deployed app'
      exit 0
    else
      echo 'CICO: Image push to registry failed'
      exit 2
    fi
#  else
#    echo 'CICO: app tests Failed'
#    exit 1
#  fi
#else
#  echo 'CICO: functional tests FAIL'
#  exit 1
#fi

