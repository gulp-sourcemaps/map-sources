'use strict';

var expect = require('expect');

var miss = require('mississippi');
var File = require('vinyl');

var mapSources = require('../');

var pipe = miss.pipe;
var from = miss.from;
var concat = miss.concat;

function makeFile() {
  var file = new File({
    cwd: __dirname,
    base: __dirname + '/assets',
    path: __dirname + '/assets/helloworld.js',
    contents: null,
  });

  file.sourceMap = {
    version: 3,
    file: 'helloworld.js',
    names: [],
    mappings: '',
    sources: ['helloworld.js', 'helloworld2.js'],
  };

  return file;
}

describe('mapSources', function() {

  it('ignores a file without sourceMap property', function(done) {
    var file = makeFile();
    delete file.sourceMap;

    var spy = expect.createSpy();

    function assert(files) {
      expect(files.length).toEqual(1);
      expect(spy).toNotHaveBeenCalled();
    }

    pipe([
      from.obj([file]),
      mapSources(spy),
      concat(assert),
    ], done);
  });

  it('only ignores a file without sourceMap property', function(done) {
    var file = makeFile();
    delete file.sourceMap;
    var file2 = makeFile();

    function mapFn(sourcePath) {
      return sourcePath;
    }

    var spy = expect.createSpy().andCall(mapFn);

    function assert(files) {
      expect(files.length).toEqual(2);
      // This is 2 because there are 2 sources on file2
      // If it were incorrect, it would have been called 4 times
      expect(spy.calls.length).toEqual(2);
    }

    pipe([
      from.obj([file, file2]),
      mapSources(spy),
      concat(assert),
    ], done);
  });

  it('ignores a file without sourceMap.sources property', function(done) {
    var file = makeFile();
    delete file.sourceMap.sources;

    var spy = expect.createSpy();

    function assert(files) {
      expect(files.length).toEqual(1);
      expect(spy).toNotHaveBeenCalled();
    }

    pipe([
      from.obj([file]),
      mapSources(spy),
      concat(assert),
    ], done);
  });

  it('only ignores a file without sourceMap.sources property', function(done) {
    var file = makeFile();
    delete file.sourceMap.sources;
    var file2 = makeFile();

    function mapFn(sourcePath) {
      return sourcePath;
    }

    var spy = expect.createSpy().andCall(mapFn);

    function assert(files) {
      expect(files.length).toEqual(2);
      // This is 2 because there are 2 sources on file2
      // If it were incorrect, it would have been called 4 times
      expect(spy.calls.length).toEqual(2);
    }

    pipe([
      from.obj([file, file2]),
      mapSources(spy),
      concat(assert),
    ], done);
  });

  it('calls map function on each source', function(done) {
    var file = makeFile();

    function mapFn(sourcePath) {
      return '/test/' + sourcePath;
    }

    function assert(files) {
      expect(files.length).toEqual(1);
      expect(files[0].sourceMap.sources).toEqual(['/test/helloworld.js', '/test/helloworld2.js']);
    }

    pipe([
      from.obj([file]),
      mapSources(mapFn),
      concat(assert),
    ], done);
  });

  it('normalizes Windows paths to unix paths', function(done) {
    var file = makeFile();

    function mapFn(sourcePath) {
      return '\\test\\' + sourcePath;
    }

    function assert(files) {
      expect(files.length).toEqual(1);
      expect(files[0].sourceMap.sources).toEqual(['/test/helloworld.js', '/test/helloworld2.js']);
    }

    pipe([
      from.obj([file]),
      mapSources(mapFn),
      concat(assert),
    ], done);
  });

  it('does not need a map function', function(done) {
    var file = makeFile();

    function assert(files) {
      expect(files.length).toEqual(1);
      expect(files[0].sourceMap.sources).toEqual(['helloworld.js', 'helloworld2.js']);
    }

    pipe([
      from.obj([file]),
      mapSources(),
      concat(assert),
    ], done);
  });

  it('ignores non-function argument', function(done) {
    var file = makeFile();

    function assert(files) {
      expect(files.length).toEqual(1);
      expect(files[0].sourceMap.sources).toEqual(['helloworld.js', 'helloworld2.js']);
    }

    pipe([
      from.obj([file]),
      mapSources('invalid argument'),
      concat(assert),
    ], done);
  });

  it('still normalizes without a map function', function(done) {
    var file = makeFile();
    file.sourceMap.sources = file.sourceMap.sources.map(function(sourcePath) {
      return '\\test\\' + sourcePath;
    });

    function assert(files) {
      expect(files.length).toEqual(1);
      expect(files[0].sourceMap.sources).toEqual(['/test/helloworld.js', '/test/helloworld2.js']);
    }

    pipe([
      from.obj([file]),
      mapSources(),
      concat(assert),
    ], done);
  });

  it('calls map function with each sourcePath and the vinyl file', function(done) {
    var file = makeFile();

    function mapFn(sourcePath, file) {
      expect(File.isVinyl(file)).toEqual(true);

      return file.base + '/' + sourcePath;
    }

    function assert(files) {
      expect(files.length).toEqual(1);

      var file = files[0];

      expect(file.sourceMap.sources).toEqual([file.base + '/helloworld.js', file.base + '/helloworld2.js']);
    }

    pipe([
      from.obj([file]),
      mapSources(mapFn),
      concat(assert),
    ], done);
  });
});
