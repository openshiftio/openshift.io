FROM centos:7
MAINTAINER "Konrad Kleine <kkleine@redhat.com>"
ENV LANG=en_US.utf8

# load the gpg keys
COPY gpg /gpg

# gpg keys listed at https://github.com/nodejs/node
RUN set -ex \
  && for key in \
    9554F04D7259F04124DE6B476D5A82AC7E37093B \
    94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
    0034A06D9D9B0064CE8ADF6BF1747F4AD2306D93 \
    FD3A5288F042B6850C66B31F09FE44734EB7990E \
    71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
    DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
    B9AE9905FFD7803F25714661B63B535A4C206CA9 \
    C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
  ; do \
    gpg --import "/gpg/${key}.gpg" ; \
  done

#ENV NPM_CONFIG_LOGLEVEL info
ENV NODE_VERSION 8.3.0

RUN yum -y update && \
    yum install -y bzip2 fontconfig tar gcc-c++ java-1.8.0-openjdk nmap-ncat psmisc gtk3 git \
      python-setuptools xorg-x11-xauth wget unzip which \
      xorg-x11-server-Xvfb xfonts-100dpi libXfont GConf2 \
      xorg-x11-fonts-75dpi xfonts-scalable xfonts-cyrillic \
      ipa-gothic-fonts xorg-x11-utils xorg-x11-fonts-Type1 xorg-x11-fonts-misc \
      epel-release libappindicator && \
      yum -y clean all

RUN curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz" \
  && curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" \
  && gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc \
  && grep " node-v$NODE_VERSION-linux-x64.tar.xz\$" SHASUMS256.txt | sha256sum -c - \
  && tar -xJf "node-v$NODE_VERSION-linux-x64.tar.xz" -C /usr/local --strip-components=1 \
  && rm "node-v$NODE_VERSION-linux-x64.tar.xz" SHASUMS256.txt.asc SHASUMS256.txt \
  && ln -s /usr/local/bin/node /usr/local/bin/nodejs

ENV FABRIC8_USER_NAME=fabric8

RUN useradd --user-group --create-home --shell /bin/false ${FABRIC8_USER_NAME}

ENV HOME=/home/${FABRIC8_USER_NAME}

ENV WORKSPACE=$HOME/wwwopenshiftio
RUN mkdir $WORKSPACE

COPY . $WORKSPACE
RUN chown -R ${FABRIC8_USER_NAME}:${FABRIC8_USER_NAME} $HOME/*

USER ${FABRIC8_USER_NAME}
WORKDIR $WORKSPACE/

VOLUME /dist

ENV ANALYTICS_WRITE_KEY="B1ASbgoKVpsyv9mcnmbmO7YoggygHq9H"

ENTRYPOINT ["/bin/bash"]