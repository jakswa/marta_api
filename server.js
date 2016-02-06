'use strict';

const newrelic = require('newrelic');
const Hapi = require('hapi');
const Marta = require('./marta');

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({ 
  routes: { cors: true }, // public API
  port: process.env.PORT || 8000 
});

// Add the route
server.route({
  method: 'GET',
  path: '/arrivals', 
  handler: Marta.arrivals
});

// Start the server
server.start((err) => {
  if (err) {
    throw err;
  }
  console.log('Server running at:', server.info.uri);
});
