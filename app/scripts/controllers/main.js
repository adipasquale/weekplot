'use strict';

var _ = window._;

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
    window.weeks = $scope.weeks;
    var years = _.map(_.range(31), function(i){ return {num: i}; });
    _.forEach(years, function(y){
      y.weeks = [];
      _.forEach(_.range(1, 53), function(i){
        y.weeks.push({num: i, year: y, absnum: y.num*52+i-1});
        $scope.weeks.push(y.weeks[y.weeks.length-1]);
      });
    });
    $scope.years = years;
    $scope.weeksHeaders = _.range(1, 52, 3);
    $scope.categories = [
      {"_id": "work", "color": "#CC353A"},
      {"_id": "school", "color": "#ADCC6B"},
      {"_id": "internship", "color": "#230946"},
      {"_id": "holiday", "color": "#FFA825"},
    ];
    $scope.periods = [];
    $scope.selectedPeriod = undefined;

    var updateRange = function(update, start, end){
      // will apply update to all weeks in the bounds, included
      _.forEach(_.range(start, end + 1), function(w){
        _.forEach(update, function(v, k){
          $scope.weeks[w][k] = v;
        });
      });
    };
    var selectRange = function(){
      updateRange({"_selected": true},
                  $scope.startWeek.absnum,
                  $scope.endWeek.absnum);
    };
    var highlightRange = function(start, end, highlightPeriod){
      updateRange({"_highlight": true,
                   "_highlightPeriod": highlightPeriod},
                  start, end);
    };
    var clearAllWeeks = function(fields){
      _.forEach($scope.weeks, function(w){
        _.forEach(fields, function(field){
          w[field] = false;
        });
      });
    };
    $scope.clearAllWeeksHighlight = function(){
      clearAllWeeks(["_highlight", "_highlightPeriod"]);
    };

    $scope.pickWeek = function(week){
      $scope.clearAllWeeksHighlight();
      if (week.period) {
        endWeeksSelections();
        if ($scope.selectedPeriod &&
            week.period === $scope.selectedPeriod) {
          $scope.selectedPeriod._selected = false;
          $scope.selectedPeriod = undefined;
        } else {
          if ($scope.selectedPeriod) {
            $scope.selectedPeriod._selected = false;
          }
          $scope.selectedPeriod = week.period;
          $scope.selectedPeriod._selected = true;
        }
      }
      else if ($scope.selectedPeriod) {
        growSelectedPeriod(week);
      }
      else if ($scope.endWeek !== undefined &&
          $scope.startWeek !== undefined) {
        // end previous selection process
        if (week.absnum >= $scope.startWeek.absnum &&
            week.absnum <= $scope.endWeek.absnum) {
          endWeeksSelections();
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

    var growSelectedPeriod = function(week){
      var updates = {"_selected": true, "period": $scope.selectedPeriod};
      if (week.absnum > $scope.selectedPeriod.endWeek.absnum) {
        updateRange(updates, $scope.selectedPeriod.endWeek.absnum + 1, week.absnum);
        $scope.selectedPeriod.endWeek = week;
      } else {
        updateRange(updates, week.absnum, $scope.selectedPeriod.startWeek.absnum - 1);
        $scope.selectedPeriod.startWeek = week;
      }
    };

    var endStartedSelection = function(week){
      week._selected = false;
      $scope.startWeek = undefined;
    };

    var endWeeksSelections = function(){
      clearAllWeeks(["_selected"]);
      $scope.startWeek = undefined;
      $scope.endWeek = undefined;
    };

    var selectWeek = function(week, startOrEnd){
      $scope[startOrEnd + "Week"] = week;
      week._selected = true;
    };

    $scope.hoverWeek = function(week){
      $scope.clearAllWeeksHighlight();
      if (week.period) {
        highlightRange(week.period.startWeek.absnum,
                       week.period.endWeek.absnum);
      }
      else if ($scope.selectedPeriod) {
        highlightAroundPeriod($scope.selectedPeriod, week, $scope.selectedPeriod);
      }
      else if ($scope.startWeek) {
        if ($scope.endWeek) {
          highlightAroundPeriod($scope, week);
        }
        else if (week.absnum > $scope.startWeek.absnum){
          highlightRange($scope.startWeek.absnum + 1, week.absnum);
        }
      }
    };

    var highlightAroundPeriod = function(period, week, highlightPeriod){
      if (week.absnum < period.startWeek.absnum){
        highlightRange(week.absnum, period.startWeek.absnum - 1, highlightPeriod);
      }
      else if (week.absnum > period.endWeek.absnum){
        highlightRange(period.endWeek.absnum + 1, week.absnum, highlightPeriod);
      }
    };

    $scope.pickCategory = function(category){
      if (!$scope.selectedPeriod &&
          $scope.startWeek && $scope.endWeek) {
        var newPeriod = {
          "startWeek": $scope.startWeek,
          "endWeek": $scope.endWeek,
          "category": category
        };
        $scope.periods.push(newPeriod);
        endWeeksSelections();
        $scope.selectedPeriod = newPeriod;
        $scope.selectedPeriod._selected = true;
      }
      if ($scope.selectedPeriod) {
        updateRange({"period": $scope.selectedPeriod},
                    $scope.selectedPeriod.startWeek.absnum,
                    $scope.selectedPeriod.endWeek.absnum);
      }
    };

    $scope.getWeekClasses = function(week){
      var classes = [];
      if (week._selected || (week.period||{})._selected){
        classes.push("selected");
      }
      if (week._highlight) {
        classes.push("highlight");
        if (week._highlightPeriod) {
          classes.push("category-" + week._highlightPeriod.category._id);
        }
      }
      if (week.period) {
        classes.push("category-" + week.period.category._id);
      }
      return classes;
    };

  });