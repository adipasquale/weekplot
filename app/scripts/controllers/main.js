'use strict';

var _ = window._, $ = window.$;

/**
 * @ngdoc function
 * @name weekplotApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the weekplotApp
 */
angular.module('weekplotApp')
  .controller('MainCtrl', function ($scope) {
    $scope.weeks = [];
    var years = _.map(_.range(31), function(i){ return {num: i}; });
    _.forEach(years, function(y){
      y.weeks = [];
      _.forEach(_.range(1, 53), function(i){
        y.weeks.push({num: i, year: y, absnum: y.num*52+i});
        $scope.weeks.push(y.weeks[y.weeks.length-1]);
      });
    });
    $scope.years = years;
    $scope.weeksHeaders = _.range(1, 52, 3);

    var selectRange = function(){
      _.forEach(_.range($scope.startWeek.absnum, $scope.endWeek.absnum), function(w){
        $scope.weeks[w]._selected = true;
      });
    };

    $scope.pickWeek = function(week){
      clearHighlighted();
      if ($scope.endWeek !== undefined &&
          $scope.startWeek !== undefined) {
        // end previous selection process
        if (week.absnum >= $scope.startWeek.absnum &&
            week.absnum <= $scope.endWeek.absnum) {
          clearSelected();
        }
        else {
          if (week.absnum < $scope.startWeek.absnum){
            selectWeek(week, "start");
          } else {
            selectWeek(week, "end");
          }
          selectRange();
        }
      }
      else if ($scope.startWeek !== undefined) {
        if ($scope.startWeek === week) {
          endStartedSelection(week);
        } else {
          // validate range is valid
          if (week.absnum > $scope.startWeek.absnum) {
            selectWeek(week, "end");
            selectRange();
          } else {
            endStartedSelection($scope.startWeek);
            selectWeek(week, "start");
          }
        }
      } else {
        selectWeek(week, "start");
      }
    };

    var clearSelected = function(){
      $scope.endWeek = undefined;
      $scope.startWeek = undefined;
      _.forEach($scope.weeks, function(w){
        w._selected = false;
      });
    };

    var endStartedSelection = function(week){
      week._selected = false;
      $scope.startWeek = undefined;
    };

    var selectWeek = function(week, startOrEnd){
      $scope[startOrEnd + "Week"] = week;
      week._selected = true;
    };

    $scope.hoverWeek = function(week){
      clearHighlighted();
      if ($scope.startWeek) {
        if ($scope.endWeek) {
          if (week.absnum < $scope.startWeek.absnum){
            highlightRange(week.absnum, $scope.startWeek.absnum);
          }
          else if (week.absnum > $scope.endWeek.absnum){
            highlightRange($scope.endWeek.absnum + 1, week.absnum);
          }
        }
        else if (week.absnum > $scope.startWeek.absnum){
          highlightRange($scope.startWeek.absnum + 1, week.absnum);
        }
      }
    };

    var clearHighlighted = function(){
      $(".week.highlight").removeClass("highlight");
    };

    var highlightRange = function(start, end) {
      var selector = _.map(_.range(start, end), function(i){
        return "#week-abs-" + i;
      }).join(",");
      $(selector).addClass("highlight");
    };

  });
