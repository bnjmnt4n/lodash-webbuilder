var PORT = Number(process.env.PORT)  || 8080;

var http = require("http");

var pkg = require('lodash-cli/package.json');
var bin = pkg.bin.lodash;
var builder = require.resolve('lodash-cli/' + bin);

var ecstatic = require('ecstatic');

http.createServer(function(req, res) {

}).listen(PORT);

