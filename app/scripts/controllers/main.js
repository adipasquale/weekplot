'use strict';

/**
 * @ngdoc function
 * @name weekplotApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the weekplotApp
 */
angular.module('weekplotApp')
  .controller('MainCtrl', function ($scope) {
    var years = _.map(_.range(31), function(i){ return {num: i}; });
    _.forEach(years, function(y){
      y.weeks = [];
      _.forEach(_.range(1, 53), function(i){
        y.weeks.push({num: i, year: y});
      });
    });
    $scope.years = years;
    $scope.weeksHeaders = _.range(1, 52, 3);

    $scope.pickWeek = function(week, evt){
      $scope.startWeek = week;
      $(evt.currentTarget).addClass("selected");
    }
  });
