"use strict";

const request = require('request');
const Promise = require('bluebird');
const moment = require('moment');
const l_ = require('lodash');

const serviceCalendar = require('./lib/schedule/calendar.json');
const MARTA_API_KEY = process.env.MARTA_TRAIN_API_KEY;
const MARTA_URL = "http://developer.itsmarta.com/RealtimeTrain/RestServiceNextTrain/GetRealtimeArrivals?apiKey="
var prRequest = Promise.promisify(request);
var _reqCache = {};

module.exports = {
  arrivals: function(request, response) {
    if (_reqCache.created && ((new Date()) - _reqCache.created) < 10000) {
      response(_reqCache.arrivals);
      return;
    } 

    let reqPromise;
    if (_reqCache.promise) {
      reqPromise = _reqCache.promise;
    } else {
      _reqCache.created = new Date();
      reqPromise = prRequest(MARTA_URL + MARTA_API_KEY);
      reqPromise.then(function() {
        _reqCache.promise = null;
      });
    }

    reqPromise.then(function(resp) {
      if (resp.statusCode == 200) {
        _reqCache.arrivals = resp.body.toLowerCase();
        // why oh why is this value a string...
        _reqCache.arrivals = _reqCache.arrivals
          .replace(/(waiting_seconds":)"([^"]+)"/g, '$1$2');
        // parsing JSON so I can fill with schedule data
        // (a little intensive... wish I could think of simpler way)
        _reqCache.arrivals = JSON.parse(_reqCache.arrivals);
        fillGapsWithSchedule(_reqCache.arrivals);
        response(_reqCache.arrivals);
      } else {
        response({error: resp.body});
      }
    });
  }
};

/* this function looks for stations that
 * have realtime data present for one direction
 * but not the other, and fills in the blanks
 * with a schedule entry
 */
var opposite = {n:'s',s:'n',e:'w',w:'e'};
function fillGapsWithSchedule(arrivals) {
  var dirs = {};

  // scan through arrivals, finding stations
  // with missing arrivals in a direction
  // (or directions, if five points station)
  for (var i = 0; i < arrivals.length; i++) {
    var arr = arrivals[i];

    if (!dirs[arr.station])
      dirs[arr.station] = [];
    var dir = dirs[arr.station];
    if (dir.indexOf(arr.direction) == -1) {
      dir.push(arr.direction);
    }
  }

  // add some 'scheduled' arrivals, if we can
  // find any in the schedule
  for(var station in dirs) {
    if (dirs[station].length % 2 == 2)
      continue; // ignore if doesn't have gaps
    for (var d = 0; d <= dirs[station].length; d++) {
      var direction = dirs[station][d];
      var gapDirection = opposite[direction];
      if (dirs[station].indexOf(gapDirection) > -1) {
        break; // five points may have 3 directions
      }
      var scheduled = nextArrivals(station, gapDirection);
      for (var i = 0; i < scheduled.length; i++) {
        var timeAndLine = scheduled[i];
        var waiting_seconds = gtfsTimeToSec(timeAndLine[0]);
        arrivals.push({
          scheduled: true,
          waiting_seconds: waiting_seconds,
          waiting_time: parseInt(waiting_seconds / 60 + 1) + " min",
          line: timeAndLine[1],
          direction: gapDirection,
          station: station
        });
      }
    }
  }
}

// waiting_seconds left
// change '24:' and '25:' to 0 and 1
// (GTFS goes past 23:59 timestamps)
function gtfsTimeToSec(timestamp) {
  var hour = parseInt(timestamp.slice(0,2));
  var now = moment();
  if ([24, 25].indexOf(hour) > -1) {
    timestamp = (hour - 24) + timestamp.slice(2);
    // imagine now = 23:59... we gotta move this one too
    // because timestamp is going to parse to early morning
    if (now.hours() > 20) {
      now.subtract(24, 'hours');
    }
  }

  var arrivalTime = moment(timestamp, 'HH:mm:ss');
  return parseInt((arrivalTime - now) / 1000);
}

// given station + direction, give us some
// scheduled arrivals in any line
// (scheduled times are sorted, using binary search)
function nextArrivals(station, dir) {
  var now = moment().format('HH:mm:ss');
  // fetch lines servicing this station in this direction
  var lines = arrivalTimes(station, dir);
  var results = [];

  for(var line in lines) {
    var times = lines[line];
    var ind = l_.sortedIndex(times, now);

    // insert two next times from each line, if present
    if (times[ind])
      results.push([times[ind], line]);
    if (times[ind+1])
      results.push([times[ind+1], line]);
  }
  // sort by times, take next 2 (regardless of line)
  return results.sort(function(t1, t2) {
    if (t1[0] == t2[0]) return 0;
    return t1[0] < t2[0] ? -1 : 1;
  }).slice(0,2);
}

// there is a parseGTFS task that builds
// this schedule data from MARTA's GTFS zip files
function arrivalTimes(station, dir) {
  if (station.indexOf('station') == -1) station += ' station';
  var dow = moment().subtract(3, 'hours').format('ddd').toLowerCase();
  var service = require("./lib/schedule/service" + serviceCalendar[dow]);
  return service[station][dir];
}
