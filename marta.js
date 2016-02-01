"use strict";

const request = require('request');
const Promise = require('bluebird');

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
        response(_reqCache.arrivals);
      } else {
        response({error: resp.body});
      }
    });
  }
};
