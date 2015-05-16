"use strict";

/** Load Node.js modules */
var path = require('path'),
    parseURL = require('url').parse,
    spawn = require('child_process').spawn;

/** Load other modules */
var hapi = require('hapi'),
    through = require('through2');

/** Used as the location of the `lodash-cli` module */
var lodashCli = require.resolve(
  'lodash-cli/' + require('lodash-cli/package.json').bin.lodash
);

/** Used as the port number to run a server on */
var port = Number(process.env.PORT)  || 8080;

// Create a server with a host and port
var server = new hapi.Server({
  connections: {
    routes: {
      files: {
        relativeTo: __dirname
      }
    }
  }
});

server.connection({
  port: port
});

server.route({
  method: 'GET',
  path: '/build',
  handler: buildLodash
});

server.route({
  method: 'GET',
  path: '/{param*}',
  handler: {
    directory: {
      path: 'public'
    }
  }
});

server.ext('onPreResponse', function (request, reply) {
  var response = request.response;
  if (!response.isBoom) {
    return reply.continue();
  }

  // 404
  var error = response;
  if (error.output.statusCode == 404) {
    return reply.file('_files/404.html').type('text/html').code(404);
  }
});

/**
 * Builds a lodash custom build.
 *
 * @private
 * @param {IncomingRequest} request The request entering the server.
 * @param {ServerResponse} reply The server response object.
 */
function buildLodash (request, reply) {
  var query = request.query, args = [lodashCli], errors = [];

  // add lodash build modifier
  var modifier = query.modifier;
  if (modifier && /^(?:compat|modern)$/i.test(modifier)) {
    args.push(modifier);
  } else if (modifier) {
    errors.push('Invalid modifier: ' + modifier);
  }

  // strict builds?
  var isStrict = query.strictBuild;
  if (isStrict == 'true') {
    args.push('strict');
  }

  // add options
  var opts = ['category', 'exports', 'iife', 'include', 'plus', 'minus', 'moduleId'];
  for (var length = opts.length, i = 0; i < length; i++) {
    var optName = opts[i], opt = query[optName];
    if (opt && (optName == 'iife' ? /^"([^"]+)"$/.test(opt) : /^[a-z,]+$/i.test(opt))) {
      args.push(optName + '=' + opt);
    } else if (opt) {
      errors.push('Invalid option `' + optName + '`: ' + opt);
    }
  }

  // minify?
  args.push(query.minify == 'true' ? '--production' : '--development')
  args.push('--silent', '--stdout');
  console.log(args);

  if (errors.length) {
    reply(
    ['ERROR:'].concat(errors).join('\n')
    ).type('text');
  } else {
    var stream = through(function() {
      var noOfRuns = 0;
      return function(chunk, enc, cb) {
        if (noOfRuns++ <= 2) {
          var string = chunk.toString();
          if (/@license/.test(string)) {
            string = string.replace(/--silent --stdout/, '-o lodash.' + modifier + '.js');
            chunk = new Buffer(string);
          }
        }
        this.push(chunk);
        cb();
      };
    }());
    var compiler = spawn('node', args);
    compiler.stdout.pipe(stream);
    compiler.stderr.pipe(stream);
    
    reply(stream).type('text');
  }
}

if (!module.parent) {
  server.start();
} else {
  module.exports = server;
}
