'use strict';

describe('Directive: dmstyle', function () {

  // load the directive's module
  beforeEach(module('weekplotApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<dmstyle></dmstyle>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the dmstyle directive');
  }));
});
