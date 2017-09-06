import 'core-js/es6/string';

import * as $ from 'jquery';
import * as URI from 'urijs';
import '../assets/stylesheets/osio.less';

import Header from "./components/header";

const header = new Header({ el: ".header" });

declare global {
  interface Window {
    analytics: SegmentAnalytics.AnalyticsJS;
  }
}

export class OpenshiftIoConfig {
  waitlistUrl: string;
  analyticsWriteKey: string;
}

export interface ConfigCallback<T> {
  (config: T): void;
}

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
        url += suffix + '/';
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

  constructor(
    private analytics: Analytics
  ) {
    this.apiUrl = this
      .api
      .buildApiUrl(AUTH_API_URL, 'api', 'api');
    console.log('Auth API URL:', this.apiUrl);
    this.authToken = localStorage.getItem('auth_token');
  }

  login() {
    this.analytics.trackLogin();
    // Logout first then login
    let redirectBackToReferrerURL = encodeURIComponent(window.location.href);
    let redirectToLoginURL = encodeURIComponent(this.apiUrl + 'login/authorize?redirect=' + redirectBackToReferrerURL);
    window.location.href = this.apiUrl + 'logout?redirect=' + redirectToLoginURL;
  }

  logout() {
    // this.analytics.trackLogout();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    this.authToken = null;
    clearTimeout(this.clearTimeoutId);
    this.refreshInterval = null;
    this.loggedIn = false;
  }

  setupRefreshTimer(refreshInSeconds: number) {
    if (!this.clearTimeoutId) {
      // refresh should be required to be less than ten minutes measured in seconds
      let tenMinutes = 60 * 10;
      if (refreshInSeconds > tenMinutes) {
        refreshInSeconds = tenMinutes;
      }
      let refreshInMs = Math.round(refreshInSeconds * .9) * 1000;
      console.log('Refreshing token in: ' + refreshInMs + ' milliseconds.');
      this.refreshInterval = refreshInMs;
      // setTimeout() uses a 32 bit int to store the delay. So the max value allowed is 2147483647
      // The bigger number will cause immediate refreshing
      // but since we refresh in 10 minutes or in refreshInSeconds whatever is sooner we are good
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
        method: 'POST',
        dataType: 'json',
        data: JSON.stringify({ "refresh_token": refreshToken }),
        success: response => {
          let token = this.processTokenResponse(response.token);
          this.setupRefreshTimer(token.expires_in);
          console.log('token refreshed at:' + Date.now());
        },
        error: () => {
          this.logout();
          console.log('Error refreshing token')
        }
      });
    }
  }

  handleLogin(url: uri.URI) {
    let token = localStorage.getItem('auth_token');
    if (token) {
      this.authToken = token;
      setTimeout(function () {
        window.location.href = `/_gettingstarted`;
      }, 1000);
      return;
    }
    let params: any = this.getUrlParams();
    if ('token_json' in params) {
      let tokenJson = decodeURIComponent(params['token_json']);
      let token = this.processTokenResponse(JSON.parse(tokenJson));
      this.setupRefreshTimer(token.expires_in);
      // Clear the tokens from the URL, they are toooo long
      history.pushState(null, "", location.href.split("?")[0]);
      // Put a short delay here, as local storage takes a few MS to update
      setTimeout(function () {
        window.location.href = `/_gettingstarted`;
      }, 1000);
      return;
    }
  }

  bindLoggedInUser() {
    this.loggedIn = true;
  }

  getUrlParams(): Object {
    let query = window.location.search.substr(1);
    let result: any = {};
    query.split('&').forEach(function (part) {
      let item: any = part.split('=');
      result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
  }

  handleError(url: uri.URI) {
    let query = url.query(true) as any;
    if (url.hasQuery('error')) {
      addToast("alert-danger", query['error']);
    }
  }

  getUser(authToken: string, success: any, error: any) {
    if (authToken) {
      $.ajax({
        url: this.apiUrl + 'user',
        headers: {
          "Authorization": "Bearer " + this.authToken,
          'Content-Type': "application/json"
        },
        method: 'GET',
        dataType: 'json',
        success: response => {
          this.analytics.identifyUser(response.data);
          success(response);
        },
        error: error
      });
    }
  }

  bindLoginLogout() {
    let _this = this;
    $("a#login").click(function () {
      _this.login();
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

export function loadConfig<T>(configName: string, cb: ConfigCallback<T>) {
  let url = `/_config/${configName}.config.json`;
  $.ajax({
    url: url,
    method: 'GET',
    dataType: 'json',
    success: response => {
      cb(response as T);
      console.log('Fetched config', url);
    },
    error: () => {
      console.log('Error fetching config', url);
    }
  });
}

function loadScripts(url: any) {
  // Alias out jquery for patternfly
  (window as any).jQuery = $;
  (window as any).$ = $;
}

export function addToast(cssClass: string, htmlMsg: string) {
  $("#toastNotification")
    .fadeOut(() =>
      $("#toastNotification")
        .removeClass('hidden')
        .removeClass('alert-info alert-sucess alert-warning alert-danger')
        .addClass(cssClass)
        .fadeIn()
    );
  $("#toastMessage").html(htmlMsg);
}

// ===== Scroll to Top ====
$(window).scroll(function () {
  if ($(this).scrollTop() >= 50) {
    $('#return-to-top').fadeIn(200);
  } else {
    $('#return-to-top').fadeOut(200);
  }
});
$('#return-to-top').click(function () {
  $('body,html').animate({
    scrollTop: 0
  }, 500);
});

function collapseNavbar() {
  if ($(".navbar").offset().top > 100) {
    $(".navbar-fixed-top").addClass("top-nav-collapse");
  } else {
    $(".navbar-fixed-top").removeClass("top-nav-collapse");
  }
}

$(window).scroll(collapseNavbar);
$(document).ready(collapseNavbar);

$(document)
  .ready(function () {

    collapseNavbar;

    let url = new URI(window.location.href);
    // Add the JS
    loadScripts(url);

    let analytics = new Analytics();

    // Load the config to a global var
    loadConfig<OpenshiftIoConfig>('www.openshift.io', (config) => {

      analytics.loadAnalytics(config.analyticsWriteKey);
      $('#registerNav').click(function () {
        analytics.trackRegister();
        window.location.href = config.waitlistUrl;
      });
      $('#registerContent').click(function () {
        analytics.trackRegister();
        window.location.href = config.waitlistUrl;
      });
    });

    // Create a nice representation of our URL

    // Build services for the login widget
    let auth = new Auth(analytics);
    auth.handleLogin(url);
    auth.handleError(url);
    auth.bindLoginLogout();
  });

export class Analytics {

  loadAnalytics(analyticsWriteKey: string) {
    if (analyticsWriteKey != 'disabled') {
      // Load Segment.io
      var analytics = (window as any).analytics = (window as any).analytics || [];
      if (!analytics.initialize) {
        if (analytics.invoked) {
          window.console && console.error && console.error("Segment snippet included twice.");
        } else {
          analytics.invoked = !0;
          analytics.methods = [
            "trackSubmit",
            "trackClick",
            "trackLink",
            "trackForm",
            "pageview",
            "identify",
            "reset",
            "group",
            "track",
            "ready",
            "alias",
            "debug",
            "page",
            "once",
            "off",
            "on"
          ];
          analytics.factory = function (t: any) {
            return function () {
              var e = Array.prototype.slice.call(arguments);
              e.unshift(t);
              analytics.push(e);
              return analytics
            }
          };
          for (var t = 0; t < analytics.methods.length; t++) {
            var e = analytics.methods[t];
            analytics[e] = analytics.factory(e)
          }
          analytics.load = function (t: any) {
            var e = document.createElement("script");
            e.type = "text/javascript";
            e.async = !0;
            e.src = ("https:" === document.location.protocol ? "https://" : "http://") + "cdn.segment.com/analytics.js/v1/" + t + "/analytics.min.js";
            var n = document.getElementsByTagName("script")[0];
            n.parentNode.insertBefore(e, n)
          };
          analytics.SNIPPET_VERSION = "4.0.0";
          analytics.load(analyticsWriteKey);
          analytics.page('landing');
        }
      }
    }
  }

  identifyUser(user: any): any {
    if (this.analytics) {
      let traits = {
        avatar: user.attributes.imageURL,
        email: user.attributes.email,
        username: user.attributes.username,
        website: user.attributes.url,
        name: user.attributes.fullName,
        description: user.attributes.bio
      } as any;
      if (localStorage['openshiftio.adobeMarketingCloudVisitorId']) {
        traits.adobeMarketingCloudVisitorId = localStorage['openshiftio.adobeMarketingCloudVisitorId'];
      }
      this.analytics.
        identify(
        user.id, traits);
    }
  }

  trackError(action: string, error: any) {
    if (this.analytics) {
      this.analytics.track('error', {
        error: error,
        action: action
      });
    }
  }

  trackLogin() {
    if (this.analytics) {
      this.analytics.track('login');
    }
  }

  trackRegister() {
    if (this.analytics) {
      this.analytics.track('registerNav');
      this.analytics.track('registerContent');
    }
  }

  // trackLogout() {
  //   if (this.analytics) {
  //     this.analytics.track('logout');
  //   }
  // }

  private get analytics(): SegmentAnalytics.AnalyticsJS {
    return window.analytics;
  }
}
