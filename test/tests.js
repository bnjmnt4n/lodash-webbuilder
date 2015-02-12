var http = require('http'),
    path = require('path'),
    fs = require('fs');

var lab = exports.lab = require('lab').script(),
    assert = require('assert');

var describe = lab.experiment,
    it = lab.test,
    before = lab.before,
    after = lab.after;

var server = require('../server');

describe('server', function () {
  var contentTypes = {
    'text': /^text\/plain(?:; charset=.+)?$/,
    'html': /^text\/html(?:; charset=.+)?$/,
    'css': /^text\/css(?:; charset=.+)?$/
  };

  var files = [{
    'name': 'index.html',
    'type': contentTypes.html
  }, {
    'name': 'css/main.css',
    'type': contentTypes.css
  }].map(function (file) {
    file.contents = fs.readFileSync(path.join(__dirname, '../public', file.name), 'utf-8');
    return file;
  });

  files.forEach(function (file) {
    var name = file.name;
    it('should return correct files for `' + name + '`', function (done) {
      server.inject('/' + name, function (res) {
        assert.equal(res.statusCode, 200, 'Status code');
        assert(file.type.test(res.headers['content-type']), 'File type');
        assert.equal(file.contents, res.rawPayload.toString('utf8'), 'File contents');
        done();
      });
    });
  });

  /*
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
       '* lodash 2.4.1 <https://lodash.com/>',
       '* Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>',
       '* Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>',
       '* Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors',
       '* Available under MIT license <https://lodash.com/license>',
       '*\/'].join('\n ')
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
  */
});
