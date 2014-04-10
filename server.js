(function() {
"use strict";

/** Load Node.js modules */
var http = require('http'),
    path = require('path'),
    parseURL = require('url').parse,
    spawn = require('child_process').spawn;

/** Used as the location of the `lodash-cli` module */
var lodashCli = require.resolve(
  'lodash-cli/' + require('lodash-cli/package.json').bin.lodash
);

/** Load other modules */
var ecstatic = require('ecstatic'),
    through = require('through2');

/** Used as the static file server middleware */
var mount = ecstatic({
  root: path.join(process.cwd(), '/public'),
  cache: 3600,
  showDir: false
});

/** Used as the port number to run a server on */
var port = Number(process.env.PORT)  || 8080;

http.createServer(function(req, res) {
  console.log(req.url);
  var parsedURL = parseURL(req.url, true);
  if (parsedURL.pathname == '/build' && parsedURL.query) {
    buildLodash(req, res, parsedURL.query);
  } else {
    mount(req, res);
  }
}).listen(port, function() {
  console.log('Listening on port ' + port);
});


/**
 * Builds a Lo-Dash custom build.
 *
 * @private
 * @param {IncomingRequest} req The request entering the server.
 * @param {ServerResponse} res The server response object.
 * @param {Object} query The parsed query string object.
 */
function buildLodash(req, res, query) {
  var args = [lodashCli], errors = [];

  // add Lo-Dash build modifier
  var modifier = query.modifier;
  if (modifier && /^(?:compat|modern|underscore|backbone)$/i.test(modifier)) {
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
  args.push(query.minify == 'true' ? '--minify' : '--debug')
  args.push('--silent', '--stdout');
  console.log(args);

  if (errors.length) {
    res.setHeader('Content-Type', 'text/plain');
    res.end(['ERROR:'].concat(errors).join('\n'))
  } else {
    var compiler = spawn('node', args);

    var stream = through(function() {
      var firstRun = true;
      return function(chunk, enc, cb) {
        if (firstRun) {
          firstRun = false;
          if (/\b@license\b/.test(chunk)) {
            res.setHeader('Content-Type', 'application/javascript');
          } else {
            res.setHeader('Content-Type', 'text/plain');
          }
        }
        this.push(chunk);
        cb();
      };
    }());

    compiler.stdout.pipe(stream);
    compiler.stderr.pipe(stream);
    stream.pipe(res);
  }
}

}.call(this));
