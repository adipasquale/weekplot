'use strict';

var _ = window._;

// --- MODELS ---
function Period(startWeek, category, maxEndWeekAbsNum, weekplot){
  this.weekplot = weekplot;
  this.startWeek = startWeek;
  this.maxEndWeekAbsNum = maxEndWeekAbsNum;  // endWeek cannot be after that
  this.endWeek = undefined;
  this.comment = undefined;
  this.category = category;
  this._selected = true;
  this._new = true;  // whether the period was saved in the WeekPlot or not
  this._finished = false; // wether the endWeek was definitely chosen or not
}
Period.prototype.setEndWeek = function(week, definitive){
  // validate that the period is valid
  var res = {"success": false};
  if (week.absnum < this.startWeek.absnum || week.absnum > this.maxEndWeekAbsNum){

  } else {
    var previousEndWeekAbsNum = (this.endWeek||{}).absnum;
    this.endWeek = week;
    if (definitive) {
      this._finished = true;
      if (this.category) {
        this.saveToWp();
        res.saved = true;
      }
    }
    this.weekplot.refreshPeriod(this, previousEndWeekAbsNum);
    res.success = true;
  }
  return res;
};
Period.prototype.setCategory = function(category){
  this.category = category;
  if (this._new) {
    this.saveToWp();
  }
};
Period.prototype.saveToWp = function(){
  this.weekplot.periods.push(this);
  this._new = false;
};
Period.prototype.detachAllWeeks = function(){
  if (this._new && this.endWeek) {
    this.weekplot.refreshPeriod(this, null, true);
  }
};

function Weekplot(years, weeks, periods, categories, name, birthDate){
  var self = this;
  this.years = years;
  this.weeks = weeks || [];
  if (!this.years) {
    this.years = _.map(_.range(31), function(i){
      return {"num": i, "weeks": []};
    });
    _.forEach(this.years, function(y){
      _.forEach(_.range(1, 53), function(i){
        y.weeks.push({num: i, year: y, absnum: y.num * 52 + i - 1});
        self.weeks.push(y.weeks[y.weeks.length-1]);
      });
    });
  }
  this.periods = periods === undefined ? [] : periods;
  this.categories = categories;
  if (!this.categories) {
    this.categories = [
      {"_id": "work", "color": "#CC353A"},
      {"_id": "school", "color": "#ADCC6B"},
      {"_id": "internship", "color": "#230946"},
      {"_id": "holiday", "color": "#FFA825"},
    ];
  }
  this.name = name;
  this.birthDate = birthDate;
  this.selectedCategory = undefined;
}
Weekplot.prototype.createPeriod = function(startWeek){
  var self = this;
  var maxWeek = _.find(
    self.weeks.slice(startWeek.absnum + 1),
    function(week){ return week.period !== undefined; }
  );
  var maxEndWeekAbsNum = maxWeek ? maxWeek.absnum : self.weeks.length;
  return new Period(startWeek, this.selectedCategory, maxEndWeekAbsNum, this);
};
Weekplot.prototype.refreshPeriod = function(period, previousEndWeekAbsNum, destroy){
  var self = this;
  var savePeriod = destroy ? undefined : period;
  var weekRange = _.range(period.startWeek.absnum, period.endWeek.absnum + 1);
  _.forEach(weekRange, function(w){
    self.weeks[w].period = savePeriod;
  });
  if (previousEndWeekAbsNum && period.endWeek.absnum <previousEndWeekAbsNum) {
    _.forEach(_.range(period.endWeek.absnum + 1, previousEndWeekAbsNum + 1), function(w){
      self.weeks[w].period = undefined;
    });
  }
};
Weekplot.prototype.selectCategory = function(category){
  _.forEach(this.categories, function(category){
    category._selected = false;
  });
  category._selected = true;
  this.selectedCategory = category;
};

/**
 * @ngdoc function
 * @name weekplotApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the weekplotApp
 */
angular.module('weekplotApp')
  .controller('MainCtrl', function ($scope) {

    $scope.wp = new Weekplot();
    $scope.weeksHeaders = _.range(1, 52, 3);
    $scope.newPeriod = undefined;
    $scope.selectedPeriod = undefined;

    window._scope = $scope;

    $scope.startSelection = function(week){
      $scope.abortNewPeriod();
      if (week.period) {
        if (week.period === $scope.selectedPeriod) {
          // re-click on the selected period => deselects it
          week.period._selected = false;
          $scope.selectedPeriod = undefined;
          // todo : handle extremes increasing
        }
        else {
          // click on another period => selects it
          week.period._selected = true;
          $scope.selectedPeriod = week.period;
        }
      } else {
        // click on a virgin week => exit selection
        if ($scope.selectedPeriod) {
          $scope.selectedPeriod._selected = false;
          $scope.selectedPeriod = undefined;
        }
        // click on a virgin week = > starts a newPeriod selection
        $scope.newPeriod = $scope.wp.createPeriod(week, $scope.selectedCategory);
      }
    };

    $scope.endSelection = function(week){
      if (!week.period || week.period === $scope.newPeriod) {
        if ($scope.newPeriod) {
          var res = $scope.newPeriod.setEndWeek(week, true);
          if (res.success) {
            $scope.selectedPeriod = $scope.newPeriod;
            if (res.saved) {
              $scope.newPeriod = undefined;
            }
          } else {
            console.log("could not setEndWeek, aborting newPeriod creation");
          }
        }
      }
    };

    $scope.hoverWeek = function(week){
      if ($scope.newPeriod && !$scope.newPeriod._finished) {
        $scope.newPeriod.setEndWeek(week, false);
      }
    };

    $scope.selectCategory = function(category){
      $scope.wp.selectCategory(category);
      if ($scope.selectedPeriod) {
        $scope.selectedPeriod.setCategory(category);
      }
    };

    $scope.clearAllWeeksHighlight = function(){

    };

    $scope.getWeekClasses = function(week){
      var classes = [];
      if ((week.period||{}).category) {
        classes.push("category-" + week.period.category._id);
      }
      if ((week.period||{})._selected) {
        classes.push("selected");
      }
      return classes;
    };

    $scope.selectNewPeriod =  function(startWeek, endWeek){
      var period = new Period(startWeek, endWeek);
      if (!period) {
        return false;
      }
      period.toggleSelected(true);
    };

    $scope.abortNewPeriod = function(){
      if ($scope.newPeriod) {
        $scope.newPeriod.detachAllWeeks();
        $scope.newPeriod = undefined;
        $scope.selectedPeriod = undefined;
      }
    };

  });