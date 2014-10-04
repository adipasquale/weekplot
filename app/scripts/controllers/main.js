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
  if (week.absnum < this.startWeek.absnum || week.absnum > this.maxEndWeekAbsNum){

  } else {
    var previousEndWeekAbsNum = (this.endWeek||{}).absnum;
    this.endWeek = week;
    if (definitive) {
      this._finished = true;
      if (this.category) {
        this.saveToWp();
      }
    }
    this.weekplot.refreshPeriod(this, previousEndWeekAbsNum);
  }
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

};
Period.prototype.destroy = function(){
  if (!this._new) {
    var idx = this.weekplot.periods.indexOf(this);
    if (idx === this.weekplot.periods.length -1) {
      delete(this.weekplot.periods[idx]);
    } else {
      this.weekplot.periods[idx] = this.weekplot.periods[this.weekplot.periods.length - 1];
      delete(this.weekplot.periods[this.weekplot.periods.length - 1]);
    }
  }
  if (this.endWeek) {
    this.weekplot.refreshPeriod(this, null, true);
  }
};

function Category(index, name, color, hidden){
  this._index = index;
  this._color = color;
  this._name = name;
  this._hidden = hidden === undefined ? false : hidden;
}

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
    this.categories = [];
    this.setDefaultCategories();
  }
  this.name = name;
  this.birthDate = birthDate;
  this.selectedCategory = undefined;
}
Weekplot.prototype.addCategory = function(name, color, hidden){
  var index = this.categories.length;
  this.categories.push(new Category(index, name, color, hidden));
};
Weekplot.prototype.setDefaultCategories = function(){
  this.addCategory("work", "#CC353A");
  this.addCategory("school", "#ADCC6B");
  this.addCategory("internship", "#230946");
  this.addCategory("holiday", "#FFA825", true);
  this.addCategory("holiday", "#EEB825", true);
  this.addCategory("holiday", "#AA8825", true);
};
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
    $scope.textbox = "";
    $scope.inCategoryCreation = false;

    window._scope = $scope;  // for debug purposes

    $scope.startSelection = function(week){
      $scope.abortNewPeriod();
      if (week.period) {
        if (week.period === $scope.selectedPeriod) {
          if (week.absnum === $scope.selectedPeriod.startWeek.absnum ||
              week.absnum === $scope.selectedPeriod.endWeek.absnum) {
            // clicking on the extremes of the currently selected period => resize
          } else {
            // click on the currently selected period => deselect it
            $scope.deselectPeriod();
          }
        }
        else {
          // click on another period => selects it
          $scope.deselectPeriod();
          week.period._selected = true;
          $scope.selectedPeriod = week.period;
        }
      } else {
        // click on a virgin week = > starts a newPeriod selection
        $scope.deselectPeriod();
        $scope.newPeriod = $scope.wp.createPeriod(week, $scope.selectedCategory);
      }
    };

    $scope.endSelection = function(week){
      if (!week.period || week.period === $scope.newPeriod) {
        if ($scope.newPeriod) {
          $scope.newPeriod.setEndWeek(week, true);
          if ($scope.newPeriod._finished) {
            $scope.selectedPeriod = $scope.newPeriod;
            if (!$scope.newPeriod._new) {
              $scope.newPeriod = undefined;
            }
          } else {
            $scope.abortNewPeriod();
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
      $scope.textbox = category._name;
      if ($scope.selectedPeriod) {
        $scope.selectedPeriod.setCategory(category);
        if ($scope.newPeriod) {
          if (!$scope.newPeriod._new) {
            $scope.newPeriod = undefined;
          }
        }
      }
    };

    $scope.createCategory = function(){
      $scope.inCategoryCreation = true;
    };

    $scope.getWeekClasses = function(week){
      var classes = [];
      if ((week.period||{}).category) {
        classes.push("category-" + week.period.category._index);
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
        $scope.newPeriod.destroy();
        $scope.newPeriod = undefined;
        $scope.selectedPeriod = undefined;
      }
    };

    $scope.deselectPeriod = function(){
      if ($scope.selectedPeriod) {
        $scope.selectedPeriod._selected = false;
        $scope.selectedPeriod = undefined;
      }
    };

    $scope.abortNewCategory = function(){
      if ($scope.inCategoryCreation) {
        $scope.inCategoryCreation = false;
      }
    };

    $scope.keyPressed = function($event){
      console.log("keyPressed " + $event.keyCode);
      if ($event.keyCode === 0) {
        // exit
        $scope.exitNewCategory();
        $scope.abortNewPeriod();
        $scope.deselectPeriod();
      } else if ($event.keyCode === 1) {
        $scope.destroySelectedPeriod();
      }
    };

    $scope.destroySelectedPeriod = function(){
      // remove
      if ($scope.canIDestroy()) {
        $scope.selectedPeriod.destroy();
        $scope.deselectPeriod();
      }
    };

    $scope.canIDestroy = function(){
      return ($scope.selectedPeriod && !$scope.selectedPeriod._new);
    };

  });