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

  handleLogin(url : uri.URI) {
    let query = url.query(true)as any;
    if (url.hasQuery('token')) {
      let token = query['token'];
      let redir = new URI('/home')
        .addQuery({token: token})
        .toString();
      console.log('Authentication succeeded, redirecting to', redir);
      window
        .localStorage
        .setItem('authToken', token);
      window.location.href = redir;
    }
  }

  handleError(url : uri.URI) {
    let query = url.query(true)as any;
    if (url.hasQuery('error')) {
      $("#errorMessage").html("abc" + query['error']);
      $("#toastNotification")
        .css('visibility', 'visible')
        .hide()
        .fadeIn()
        .removeClass('hidden');
    }
  }

  updateUserMenu() {
    let token = window
      .localStorage
      .getItem('authToken');
    if (token) {
      $.ajax({
        url: this.apiUrl + 'user',
        headers: {
          "Authorization": "Bearer " + token,
          'Content-Type': "application/json"
        },
        method: 'GET',
        dataType: 'json',
        success: response => {
          console.log(response);
          let user = response.data;
          if (user.attributes.imageURL) {
            $("#userimage")
              .attr("src", user.attributes.imageURL)
              .removeClass("hidden");
          } else {
            $("#nouserimage").removeClass("hidden");
          }
          $("#name").html(user.attributes.fullName);
          $("#loggedout").hide();
          $("#loggedin").removeClass('hidden');
        }
      });
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

    let auth = new Auth();
    let url = new URI(window.location.href);
    auth.handleLogin(url);

    loadScripts();

    auth.handleError(url);
    auth.updateUserMenu();

    $("a#login").click(function () {
      auth.login();
    });

  });
