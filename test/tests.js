var http = require('http'),
    path = require('path'),
    fs = require('fs');

var lab = require('lab'),
    supertest = require('supertest');

var describe = lab.experiment,
    it = lab.test,
    before = lab.before,
    after = lab.after;

var app = require('../server'),
    request;

describe('server', function () {
  before(function (done) {
    request = supertest(app);
    done();
  });

  var files = [{
    'name': 'index.html',
    'type': /^text\/html(?:; charset=.+)?$/
  }, {
    'name': 'main.css',
    'type': /^text\/css(?:; charset=.+)?$/
  }].map(function (file) {
    file.contents = fs.readFileSync(path.join(__dirname, '../public', file.name), 'utf-8');
    return file;
  });

  files.forEach(function (file) {
    var name = file.name;
    it('should return correct files for `' + name + '`', function (done) {
      request
        .get('/' + name)
        .expect('Content-Type', file.type)
        .expect(200, file.contents, done);
    });
  });

  after(function (done) {
    request = null;
    done();
  });
});
