FROM fabric8/fabric8-openshift-nginx:vd83b3a1
LABEL maintainer "Devtools <devtools@redhat.com>"

USER root

ADD nginx.conf /etc/nginx/nginx.conf

RUN rm -rf /usr/share/nginx/html/
COPY dist /usr/share/nginx/html
RUN chmod -R 777 /usr/share/nginx/html/

USER ${FABRIC8_USER_NAME}
