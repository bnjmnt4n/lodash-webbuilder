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
var ecstatic = require('ecstatic');

/** Used as the static file server middleware */
var mount = ecstatic({ root: path.join(__dirname, '/public'), cache: 3600, showDir: false });

/** Used as the port number to run a server on */
var port = Number(process.env.PORT)  || 8080;

http.createServer(function(req, res) {
  var parsedURL = parseURL(req.url, true);
  if (parsedURL.pathname == '/build' && parsedURL.query) {
    buildLodash(req, res, parsedURL.query);
  } else {
    mount(req, res);
  }
}).listen(port);


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
  if (modifier && /^[a-z,]+$/i.test(modifier) && modifier != 'modularize') {
    args.push(modifier);
  } else if (modifier) {
    errors.push('Invalid modifier: ' + modifier);
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
  args.push(query.minify ? '--minify' : '--debug')
  args.push('--silent', '--stdout');
  console.log(args);

  res.setHeader('content-type', 'text/plain');
  if (errors.length) {
    res.end(['ERROR:'].concat(errors).join('\n'))
  } else {
    var compiler = spawn('node', args);

    compiler.stdout.pipe(res);
    compiler.stderr.pipe(res);
  }
}

}.call(this));
