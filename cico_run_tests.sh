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

docker exec wwwopenshiftio-builder npm run build:prod
docker exec -u root wwwopenshiftio-builder cp -r /home/fabric8/wwwopenshiftio/dist /
