var port = Number(process.env.PORT)  || 8080;

var http = require('http'),
    path = require('path'),
    parseURL = require('url').parse,
    spawn = require('child_process').spawn;

var lodashCli = require('lodash-cli/package.json').bin.lodash;
lodashCli = require.resolve('lodash-cli/' + lodashCli);

var ecstatic = require('ecstatic');

var mount = ecstatic({ root: path.join(__dirname, '/public'), cache: 3600, showDir: false });

http.createServer(function(req, res) {
  var parsedURL = parseURL(req.url, true);
  if (parsedURL.pathname == '/build' && parsedURL.query) {
    buildLodash(req, res, parsedURL.query);
  } else {
    mount(req, res);
  }
}).listen(port);

function buildLodash(req, res, query) {
  var args = [lodashCli];

  // add Lo-Dash build modifier
  var modifier = query.modifier;
  if (modifier && /^[\w,]+$/.test(modifier) && modifier != 'modularize') {
    args.push(modifier);
  }

  // add options
  var opts = ['category', 'exports', 'iife', 'include', 'plus', 'minus', 'moduleId'];
  for (var length = opts.length, i = 0; i < length; i++) {
    var optName = opts[i], opt = query[optName];
    if (opt && (optName == 'iife' ? /^(?:"()"|\S+)$/.test(opt) : /^[\w,]+$/.test(opt))) {
      args.push(optName + '=' + opt);
    }
  };
  // minify?
  args.push(query.minify ? '--minify' : '--debug')
  args.push('--silent', '--stdout');
  console.log(args);

  var compiler = spawn('node', args);

  compiler.stdout.pipe(res);
  compiler.stderr.pipe(res);
  res.setHeader('content-type', 'text/plain');
}
