import 'core-js/es6/string';

import * as $ from 'jquery';
import * as URI from 'urijs';
import '../assets/stylesheets/custom.scss';
import './header.scss';

import { ComponentAnalyses } from './component-analyses';
import { StackAnalyses } from './stack-analyses';

declare global {
  interface Window {
    analytics: SegmentAnalytics.AnalyticsJS;
  }
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

  constructor() {
    this.apiUrl = this
      .api
      .buildApiUrl(AUTH_API_URL, 'api', 'api');
    console.log('Auth API URL:', this.apiUrl);
    this.authToken = localStorage.getItem('auth_token');
  }

  login() {
    analytics.trackLogin();
    window.location.href = this.apiUrl + 'login/authorize';
  }

  logout() {
    analytics.trackLogout();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    this.authToken = null;
    clearTimeout(this.clearTimeoutId);
    this.refreshInterval = null;
    this.loggedIn = false;
    $("#waitlistform").show();
    $("#waitlisttext").show();
    $(".login-hide").show();
    $("#home").hide();
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
        method: 'POST',
        dataType: 'json',
        data: JSON.stringify({ "refresh_token": refreshToken }),
        success: response => {
          let responseJson = response.data;
          let token = this.processTokenResponse(responseJson.token);
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
      // refresh the token in five seconds to make sure we have expiry and a running timer - only do this first time in
      if (!this.refreshInterval) {
        this.setupRefreshTimer(15);
      }
      this.bindLoggedInUser();
      return;
    }
    let params: any = this.getUrlParams();
    if ('token_json' in params) {
      let tokenJson = decodeURIComponent(params['token_json']);
      let token = this.processTokenResponse(JSON.parse(tokenJson));
      this.setupRefreshTimer(token.expires_in);
      // Put a short delay here, as local storage takes a few MS to update
      setTimeout(function () {
        window.location.href = `/_home`;
      }, 1000)
      return;
    }
  }

  bindLoggedInUser() {
    this.loggedIn = true;
    this.updateUserMenu();
    $("#waitlistform").hide();
    $("#waitlisttext").hide();
    $(".login-hide").hide();
    $("#home").show();
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

  updateUserMenu() {
    if (this.authToken) {
      this.getUser(this.authToken, (response: any) => {
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
      },
        (response: JQueryXHR, textStatus: string, errorThrown: string) => {
          if (response.status == 401) {
            this.refreshToken();
          } else {
            this.logout();
          }
        }
      );
    } else {
      $("#loggedout").show();
      $("#loggedin").hide();
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
          analytics.identifyUser(response.data);
          success(response);
        },
        error: error
      });
    }
  }

  bindLoginLogout() {
    let _this = this;
    $("a#login, button#login").click(function () {
      _this.login();
    });

    $("a#logout").click(function () {
      _this.logout();
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

  private clearTimeoutId: number;
  private refreshInterval: number;

  submit(email: string, voucherCode: string) {
    let sub = $("#iframe").contents().find("#formsub");
    sub.find("#emailsub").val(email);
    sub.find("#vouchercodesub").val(voucherCode);
    sub.submit();
    analytics.identifyWaitlist(email);
    analytics.trackWaitlisting(voucherCode);
    $("#register").attr("disabled", "true");
    // Start checking for waitlisting to be successful
    this.checkWaitlisting(0);
  }

  bindWaitListForm() {
    $("#waitlistform").submit((val: any) => {
      let email = $("#email").val();
      let voucherCode = $("#vouchercode").val();
      console.log(email, voucherCode);
      this.submit(email, voucherCode);
      event.preventDefault();
    });
    $('<iframe height="0" width="0" id="iframe" class="hidden"></iframe>')
      .insertAfter('#waitlistform');

    $("#iframe").contents().find("body")
      .html('<form method="POST" action="' + this.GOOGLE_FORM_URL + '" id="formsub">' +
      '<input type="text" name="entry.31873912" id="emailsub">' +
      '<input type="text" name="entry.170221386" id="vouchercodesub">' +
      '<input type="text" name="fbzx" value="' + this.SUBMIT_REF + '">' +
      '<input type="text" name="pageHistory" value="0">' +
      '<input type="text" name="draftresponse" id="[null, null, -9199359477331487980]">' +
      '<input type="text" name="fvv" value="1">' +
      '<input type="submit">' +
      '</form>');
  }

  setupRefreshTimer(iteration: number) {
    let refreshInSeconds = 0.5;
    if (!this.clearTimeoutId) {
      let refreshInMs = Math.round(refreshInSeconds * .9) * 1000;
      console.log('Checking for waitlisting: ' + refreshInMs + ' milliseconds.');
      this.refreshInterval = refreshInMs;
      this.clearTimeoutId = setTimeout(() => this.checkWaitlisting(iteration + 1), refreshInMs);
    }
  }

  checkWaitlisting(iteration: number) {
    if ($("#iframe").contents().find(".freebirdFormviewerViewResponseConfirmationMessage")) {
      // addToast("alert-success", "We've placed you on the waitlist! We'll be in touch soon.");
      $("#email").attr("disabled", "true");
      $("#vouchercode").attr("disabled", "true");
      $("#waitlistform").hide();
      $(".submit-show")
          .removeClass('hidden')
          .show();
      $(".submit-hide").hide();
      $("#userLogin").hide();
    } else if (iteration > 60) {
      // Give up after 30 seconds
      addToast("alert-danger", "Waitlisting failed. Please try again later.");
      $("#register").removeAttr("disabled");
    }
    else {
      this.setupRefreshTimer(iteration);
    }
  }
}

function loadScripts() {
  // Alias out jquery for patternfly
  (window as any).jQuery = $;
  (window as any).$ = $;
  // Add patternfly - I don't need it in the main bundle
  $("body").append("<script async src=\"https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/js/" +
    "bootstrap.min.js\"></script>");
  $("body").append("<script async src=\"https://cdnjs.cloudflare.com/ajax/libs/patternfly/3.21.0/js/patter" +
    "nfly.min.js\"></script>");
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

$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})

$(function() {
    $('a.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 1500, 'easeInOutExpo');
        event.preventDefault();
    });
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

    // Add the JS
    loadScripts();

    // Create a nice representation of our URL
    let url = new URI(window.location.href);
    
    // Hide Home menu item
    $("#home").hide();

    // Build services for the login widget
    let auth = new Auth();
    auth.handleLogin(url);
    auth.handleError(url);
    auth.updateUserMenu();
    auth.bindLoginLogout();

    // Build services for the waitlist widget
    let waitlist = new Waitlist();
    waitlist.bindWaitListForm();

    // Build services for analysis of compoment
    let componentAnalyses = new ComponentAnalyses();
    componentAnalyses.buildComponentAnalyses();

    // Build services for analysis of stack
    let stackAnalyses = new StackAnalyses();
    stackAnalyses.buildStackAnalyses();

  });

export class Analytics {

  loadAnalytics() {
    if (ANALYTICS_WRITE_KEY != 'disabled') {
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
          analytics.load(ANALYTICS_WRITE_KEY);
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
      };
      this.analytics.
        identify(
        user.id, traits);
    }
  }

  identifyWaitlist(email: string): any {
    if (this.analytics) {
      let traits = {
        email: email,
      };
      this.analytics
        .identify(traits);
    }
  }

  trackWaitlisting(accessCode: string) {
    if (this.analytics) {
      this.analytics.track('waitlisted', {
        accessCode: accessCode
      });
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

  trackLogout() {
    if (this.analytics) {
      this.analytics.track('logout');
    }
  }

  private get analytics(): SegmentAnalytics.AnalyticsJS {
    return window.analytics;
  }
}

let analytics = new Analytics();

analytics.loadAnalytics();
