FROM centos:7
MAINTAINER "Pete Muir <pmuir@bleepbleep.org.uk>"
ENV LANG=en_US.utf8

ENV HUGO_VERSION=0.19

RUN curl -SLO "https://github.com/spf13/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_Linux-64bit.tar.gz" \
  && tar -xzf "hugo_${HUGO_VERSION}_Linux-64bit.tar.gz" -C /usr/local --strip-components=1 \
  && rm "hugo_${HUGO_VERSION}_Linux-64bit.tar.gz" \
  && ln -s /usr/local/hugo_${HUGO_VERSION}_linux_amd64 /usr/local/bin/hugo

ENV FABRIC8_USER_NAME=fabric8

RUN useradd --user-group --create-home --shell /bin/false ${FABRIC8_USER_NAME}

ENV HOME=/home/${FABRIC8_USER_NAME}

ENV WORKSPACE=${HOME}/www.openshift.io
RUN mkdir -p ${WORKSPACE}

COPY . $WORKSPACE
RUN chown -R ${FABRIC8_USER_NAME}:${FABRIC8_USER_NAME} $WORKSPACE*
RUN chown -R ${FABRIC8_USER_NAME}:${FABRIC8_USER_NAME} $WORKSPACE/.*

USER ${FABRIC8_USER_NAME}
WORKDIR $WORKSPACE/

VOLUME /dist

ENTRYPOINT ["/bin/bash"]
