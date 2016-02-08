var rewire = require('rewire');
var marta = rewire('../marta');
var moment = require('moment-timezone');
var expect = require('chai').expect;

describe('marta', function() {

  describe('#gtfsSeconds', function() {
    var gtfsSeconds = marta.__get__('gtfsSeconds');
    var now = moment();
    var timestamp;
    var result = function () {
      return gtfsSeconds(now, timestamp());
    };

    describe('with timestamp 5s away', function() {
      timestamp = function() {
        return now.clone().add(5, 'seconds').format('HH:mm:ss');
      };

      describe("using now as time", function() {
        it('should return 5 when 5 secs ahead of now', function() {
          expect(result()).to.equal(5);
        });
      });

      describe("using 11:59:59 as now", function() {
        beforeEach(function() {
          now = moment('11:59:59', 'HH:mm:ss');
        })
        it('should return 5 when 5 secs ahead of now', function() {
          expect(result()).to.equal(5);
        });
      });
      describe("using 12:00:01 as now", function() {
        beforeEach(function() {
          now = moment('12:00:01', 'HH:mm:ss');
        });
        it('should return 5 when 5 secs ahead of now', function() {
          expect(result()).to.equal(5);
        });
      });
    });
  });
});
