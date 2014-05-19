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

  files = {
    '404': fs.readFileSync(path.join(__dirname, '../public/404.html'), 'utf-8'),
    'toTest': ['randomURL', '404url']
  }
  files.toTest.forEach(function (name) {
    it('should return 404 for unknown URL `' + name + '`', function (done) {
      request
        .get('/' + name)
        .expect('Content-Type', /^text\/html(?:; charset=.+)?$/)
        .expect(200, files['404'], done);
    });
  });

  after(function (done) {
    request = null;
    done();
  });
});
