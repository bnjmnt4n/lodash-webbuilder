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

  var contentTypes = {
    'text': /^text\/plain(?:; charset=.+)?$/,
    'html': /^text\/html(?:; charset=.+)?$/,
    'css': /^text\/css(?:; charset=.+)?$/
  };

  var files = [{
    'name': 'index.html',
    'type': contentTypes.html
  }, {
    'name': 'main.css',
    'type': contentTypes.css
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
        .expect('Content-Type', contentTypes.html)
        .expect(404, files['404'], done);
    });
  });

  files = {
    'contents':
      ['/**',
       '* @license',
       '* Lo-Dash 2.4.1 <http://lodash.com/>',
       '* Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>',
       '* Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>',
       '* Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors',
       '* Available under MIT license <http://lodash.com/license>',
       '*/'].join('\n ')
  }

  it('should serve the default build when called without query-strings', {
    'timeout': 30000
  }, function (done) {
    request
      .get('/build')
      .expect('Content-Type', contentTypes.text)
      .expect(function (res) {
        if (res.statusCode != 200) {
          throw Error('statusCode is ' + res.statusCode + '.');
        }

        if (!res.text) {
          throw Error('No response available.')
        }

        if (res.text.indexOf(files.contents) != 0) {
          throw Error('Invalid response: ' + res.text);
        }

        done();
      });
  });

  files = ['?modifier=compatibility', '?iife=hello', 'include=much+tests'];

  files.forEach(function (file) {
    var url = file.url;
    it('should error on illegal query-string: `' + url + '`', {
      'timeout': 30000
    }, function (done) {
      request
        .get('/build')
        .expect('Content-Type', contentTypes.text)
        .expect(function (res) {
          if (res.statusCode != 200) {
            throw Error('statusCode is ' + res.statusCode + '.');
          }

          if (!res.text) {
            throw Error('No response available.')
          }

          if (res.text.indexOf('ERROR') != 0) {
            throw Error('Invalid response: ' + res.text);
          }

          done();
        });
    });
  });

  after(function (done) {
    request = null;
    done();
  });
});
