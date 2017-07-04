# OpenShift.io

A free, end-to-end, cloud-native development experience.

## Community Feedback

If you have feedback, suggestions and ideas we are to be found at the
following places:

irc at [\#openshiftio on Freenode](irc://freenode.org/#openshiftio) or [webchat](http://webchat.freenode.net/?channels=%23openshiftio)

issues at [openshift.io](https://github.com/openshiftio/openshift.io/issues)

stackoverflow with tag [openshiftio](http://stackoverflow.com/questions/tagged/openshiftio)

## Upstream Development

The upstream for openshift.io is primarily in the [fabric8](https://fabric8.io) project.
fabric8 is found in the following organizations:

* <https://github.com/fabric8io>
* <https://github.com/fabric8-ui>
* <https://github.com/fabric8-analytics>
* <https://github.com/fabric8-quickstarts>
* <https://github.com/fabric8io-images>
* <https://github.com/fabric8-services>

## Building and deploying

### Backend API

Make sure you setup the necessary connections to the backend. You can run it locally by setting these environment variables:

* `export FABRIC8_WIT_API_URL="http://api.prod-preview.openshift.io/api/"`
* `export FABRIC8_STACK_API_URL="http://recommender.api.prod-preview.openshift.io/api/v1/"`

in your .bash_profile and reload the shell.

### VS Code

Run `ext install EditorConfig` to read the `.editorconfig` file

### To start

Run `npm start`. This will start the UI with livereload enabled.
