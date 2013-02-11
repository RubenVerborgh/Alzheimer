var fs = require("fs"),
    Stream = require("stream"),
    util = require("util");
var promiscuous = require("promiscuous");

global.readStream = function (stream, callback) {
  var result = "";
  stream.on('data',  function (data)  { result += data; })
        .on('end',   function ()      { callback(null, result); })
        .on('error', function (error) { callback(error); })
        .resume();
};

global.createErrorStream = function (error) {
  return new ErrorStream(error);
};
function ErrorStream(error) {
  this.resume = function () {};
  process.nextTick(this.emit.bind(this, "error", error));
}
util.inherits(ErrorStream, Stream);

global.createPromisedStream = function (filename, options) {
  var stream = fs.createReadStream(filename, options);
  stream.pause()
  return promiscuous.resolve(stream);
}
