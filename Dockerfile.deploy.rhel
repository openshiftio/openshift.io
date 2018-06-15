FROM quay.io/openshiftio/rhel-base-fabric8-openshift-nginx:latest
LABEL maintainer "Devtools <devtools@redhat.com>"
LABEL author "Devtools <devtools@redhat.com>"

USER root

ADD nginx.conf /etc/nginx/nginx.conf

RUN rm -rf /usr/share/nginx/html/
COPY dist /usr/share/nginx/html
RUN chmod -R 777 /usr/share/nginx/html/

USER ${FABRIC8_USER_NAME}
