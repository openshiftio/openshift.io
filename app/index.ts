import 'core-js/es6/string';

import * as $ from 'jquery';
import * as URI from 'urijs';
import '../assets/stylesheets/variables.scss';
import '../assets/stylesheets/custom.scss';
import './header.scss';

export class ApiLocator {

  buildApiUrl(override: string, subdomain: string, suffix: string) {
    if (override) {
      return override;
    } else {
      // Simple check to trim www
      let domainname: string = window.location.hostname;
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

export class Token {
  'access_token': string;
  'expires_in': number;
  'refresh_expires_in': number;
  'refresh_token': string;
  'token_type': string;
}

export class Auth {

  readonly APP_PATH = '/home';
  private api: ApiLocator = new ApiLocator();
  private apiUrl: string;

  private refreshInterval: number;
  private clearTimeoutId: any;

  private loggedIn: boolean;

  private authToken: string;

  constructor() {
    this.apiUrl = this
      .api
      .buildApiUrl(AUTH_API_URL, 'api', 'api');
    console.log('Auth API URL:', this.apiUrl);
    this.authToken = localStorage.getItem('auth_token');
  }

  login() {
    window.location.href = this.apiUrl + '/login/authorize';
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    this.authToken = null;
    clearTimeout(this.clearTimeoutId);
    this.refreshInterval = null;
    this.loggedIn = false;
    this.updateUserMenu();
  }

  setupRefreshTimer(refreshInSeconds: number) {
    if (!this.clearTimeoutId) {
      let refreshInMs = Math.round(refreshInSeconds * .9) * 1000;
      console.log('Refreshing token in: ' + refreshInMs + ' milliseconds.');
      this.refreshInterval = refreshInMs;
      this.clearTimeoutId = setTimeout(() => this.refreshToken(), refreshInMs);
    }
  }

  refreshToken() {
    if (this.loggedIn) {
      this.clearTimeoutId = null;
      let refreshTokenUrl = this.apiUrl + '';
      let refreshToken = localStorage.getItem('refresh_token');
      let body = JSON.stringify({ "refresh_token": refreshToken });
      $.ajax({
        url: this.apiUrl + 'login/refresh',
        headers: {
          "Authorization": "Bearer " + this.authToken,
          'Content-Type': "application/json"
        },
        method: 'GET',
        dataType: 'json',
        success: response => {
          let responseJson = response.json();
          let token = this.processTokenResponse(responseJson.token);
          this.setupRefreshTimer(token.expires_in);
          console.log('token refreshed at:' + Date.now());

        }
      });
    }
  }

  handleLogin(url: uri.URI) {
    let query = url.query(true) as any;
    if (url.hasQuery('token')) {
      this.loggedIn = true;
      this.authToken = query['token'];
      let redir = new URI('/home')
        .addQuery({ token: this.authToken })
        .toString();
      console.log('Authentication succeeded, redirecting to', redir);
      window
        .localStorage
        .setItem('auth_token', this.authToken);
      window.location.href = redir;
    }
  }

  handleError(url: uri.URI) {
    let query = url.query(true) as any;
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
    if (this.authToken) {
      $.ajax({
        url: this.apiUrl + 'user',
        headers: {
          "Authorization": "Bearer " + this.authToken,
          'Content-Type': "application/json"
        },
        method: 'GET',
        dataType: 'json',
        success: (response: any) => {
          let user = response.data;
          if (user.attributes.imageURL) {
            $("#userimage")
              .attr("src", user.attributes.imageURL)
              .removeClass("hidden");
          } else {
            $("#nouserimage").removeClass("hidden");
          }
          $("#name").html(user.attributes.fullName);
          $("#profilelink").attr("href", "/" + user.attributes.username);
          $("#settingslink").attr("href", "/" + user.attributes.username + "/_settings");
          $("#loggedout").hide();
          $("#loggedin").removeClass('hidden');
        }
      });
    } else {
      $("#loggedout").show();
      $("#loggedin").hide();
    }
  }
  
  bindLoginLogout() {
    
  $("a#login").click(function () {
      this.login();
    });

    $("a#logout").click(function () {
      this.logout();
    });    
  }

  processTokenResponse(response: any): Token {
    let token = response as Token;
    this.authToken = token.access_token;
    localStorage.setItem('auth_token', this.authToken);
    localStorage.setItem('refresh_token', token.refresh_token);
    return token;
  }
}

export class Waitlist {

  readonly SUBMIT_REF = '808217156658529043';
  readonly GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSenhkARBc9fc2lKWKCD0ahMVuFjPZYxYsVwemCAzj4jL-WtPw/formResponse?fbzx=' + this.SUBMIT_REF;

  submit(email: string, voucherCode: string) {
    $.ajax({
      url: this.GOOGLE_FORM_URL,
      type: "POST",
      data: {
        'entry.31873912': email,
        'entry.170221386': voucherCode,
        fbzx: this.SUBMIT_REF,
        pageHistory: 0,
        draftresponse: [null, null, "-9199359477331487980"],
        fvv: 1
      }
    });
  }

  bindWaitListForm() {
    $("#waitlistform").submit((val: any) => {
      let email = $("#email").val();
      let voucherCode = $("#vouchercode").val();
      console.log(email, voucherCode);
      event.preventDefault();
    });
  }

}

function loadScripts() {
  // Alias out jquery for patternfly
  (window as any).jQuery = $;
  (window as any).$ = $;

  // Add patternfly - I don't need it in the main bundle
  $("body").append("<script  src=\"https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/js/" +
    "bootstrap.min.js\"></script>");
  $("body").append("<script  src=\"https://cdnjs.cloudflare.com/ajax/libs/patternfly/3.21.0/js/patter" +
    "nfly.min.js\"></script>");
    
}

$(document)
  .ready(function () {

    // Add the JS
    loadScripts();

    // Create a nice representation of our URL
    let url = new URI(window.location.href);

    // Build services for the login widget
    let auth = new Auth();
    auth.handleLogin(url);
    auth.handleError(url);
    auth.updateUserMenu();
    auth.bindLoginLogout();

    // Build services for the waitlist widget


  });
