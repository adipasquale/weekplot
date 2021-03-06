'use strict';

/**
 * @ngdoc directive
 * @name weekplotApp.directive:dmstyle
 * @description
 * # dmstyle
 */
angular.module('weekplotApp')
  .directive('style', function($compile) {
    return {
      restrict: 'E',
      link: function postLink(scope, element) {
        if (element.html()) {
          var template = $compile('<style ng-bind-template="' + element.html() + '"></style>');
          element.replaceWith(template(scope));
        }
      }
    };
  });