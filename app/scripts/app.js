'use strict';

/**
 * @ngdoc overview
 * @name weekplotApp
 * @description
 * # weekplotApp
 *
 * Main module of the application.
 */
angular
  .module('weekplotApp', [
    'ngRoute',
    'ngTouch'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
