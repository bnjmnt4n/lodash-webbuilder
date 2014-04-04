var PORT = Number(process.env.PORT)  || 8080;

var http = require('http'),
    parseURL = require('url').parse,
    parseQS = require('qs').parse;

var pkg = require('lodash-cli/package.json'),
    bin = pkg.bin.lodash,
    builder = require.resolve('lodash-cli/' + bin);

var ecstatic = require('ecstatic');

var mount = ecstatic({ });

http.createServer(function(req, res) {

}).listen(PORT);
