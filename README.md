# OpenShift.io

OpenShift.io is a cloud-native development environment for planning, creating and deploying hybrid cloud services. It provides a full toolchain for development teams, in the cloud with zero setup and maintenance.

## Community Feedback

If you have feedback, suggestions and ideas:

irc at [\#openshiftio on Freenode](irc://freenode.org/#openshiftio) or [webchat](http://webchat.freenode.net/?channels=%23openshiftio)

issues at [openshift.io](https://github.com/openshiftio/openshift.io/issues)

stackoverflow with tag [openshiftio](http://stackoverflow.com/questions/tagged/openshiftio)

## Upstream Development

The upstream for openshift.io is primarily in the [fabric8](https://fabric8.io) and [Eclipse Che](https://github.com/eclipse/che) projects.
fabric8 is found in the following organizations:

* <https://github.com/fabric8io>
* <https://github.com/fabric8-ui>
* <https://github.com/fabric8-analytics>
* <https://github.com/fabric8-quickstarts>
* <https://github.com/fabric8io-images>
* <https://github.com/fabric8-services>

## Building and Deploying the Marketing Pages

The following instructions will allow you to work on the IO marketing pages. The OpenShift.io product is being developed in the cloud at [OpenShift.io](https://openshift.io/) and so cannot be build and deployed locally (of course you can build and deploy the upstream components in OpenShift.io by visiting the upstream repos). 

### Setup Backend API

Make sure you setup the necessary connections to the backend. You can run it locally by setting these environment variables:

* `export FABRIC8_WIT_API_URL="http://api.prod-preview.openshift.io/api/"`
* `export FABRIC8_STACK_API_URL="http://recommender.api.prod-preview.openshift.io/api/v1/"`

in your .bash_profile and reload the shell.

### VS Code

Run `ext install EditorConfig` to read the `.editorconfig` file

### To Start

Run `npm start`. This will start the login page UI with livereload enabled.
