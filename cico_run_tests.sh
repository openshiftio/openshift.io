#!/bin/bash

# Show command before executing
set -x

# Exit on error
set -e

# We need to disable selinux for now, XXX
/usr/sbin/setenforce 0

# Get all the deps in
yum -y install \
  docker \
  make \
  git
service docker start

# Build builder image
docker build -t wwwopenshiftio-builder -f Dockerfile.builder .
mkdir -p dist && docker run --detach=true --name=wwwopenshiftio-builder -t -v $(pwd)/dist:/dist:Z wwwopenshiftio-builder

# Build almighty-ui
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

## All ok, build prod version
#if [ $? -eq 0 ]; then
#  echo 'CICO: functional tests OK'
  docker exec wwwopenshiftio-builder npm run build:prod
  docker exec -u root wwwopenshiftio-builder cp -r /home/fabric8/dist /
#else
#  echo 'CICO: functional tests FAIL'
#  exit 1
#fi
