import 'core-js/es6/string';

import * as $ from 'jquery';
import * as URI from 'urijs';

export class ApiLocator {

  buildApiUrl(override : string, subdomain : string, suffix : string) {
    if (override) {
      return override;
    } else {
      // Simple check to trim www
      let domainname : string = window.location.hostname;
      if (domainname.startsWith('www')) {
        domainname = window
          .location
          .hostname
          .slice(4);
      }
      let url = domainname;
      if (window.location.port) {
        url += ':' + window.location.port;
      }
      if (subdomain) {
        url = subdomain + '.' + url + '/';
      }
      if (suffix) {
        url += suffix;
      }
      url = window.location.protocol + '//' + url;
      return url;
    }
  }

}

export class Auth {

  readonly APP_PATH = '/home';
  private api : ApiLocator = new ApiLocator();
  private apiUrl : string;

  constructor() {
    console.log('Auth API URL:', this.apiUrl);
    this.apiUrl = this
      .api
      .buildApiUrl(AUTH_API_URL, 'api', 'api');
  }

  login() {
    window.location.href = this.apiUrl + '/login/authorize';
  }

  handleLogin() {
    let url = new URI(window.location.href);
    let query = url.query(true)as any;
    if (url.hasQuery('token')) {
      let redir = new URI('/home')
        .addQuery({token: query['token']})
        .toString();
      console.log('Authentication succeeded, redirecting to', redir);
      window.location.href = redir;
    } else if (url.hasQuery('error')) {
      $("#errorMessage").html("abc" + query['error']);
      $("#toastNotification").css('visibility','visible').hide().fadeIn().removeClass('hidden');;
    }
  }
}

function loadScripts() {
  // Alias out jquery for patternfly
  (window as any).jQuery = $;
  (window as any).$ = $;

  // Add patternfly - I don't need it in the main bundle
  $("body").append("<script src=\"https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/js/" +
      "bootstrap.min.js\"></script>");
  $("body").append("<script src=\"https://cdnjs.cloudflare.com/ajax/libs/patternfly/3.21.0/js/patter" +
      "nfly.min.js\"></script>");
}

$(document)
  .ready(function () {

    loadScripts();

    let auth = new Auth();
    auth.handleLogin();

    $("a#login").click(function () {
      auth.login();
    });

  });
