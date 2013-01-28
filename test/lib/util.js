var Stream = require("stream"),
    util = require("util");

global.readStream = function (stream, callback) {
  var result = "";
  stream.on('data',  function (data)  { result += data; })
        .on('end',   function ()      { callback(null, result); })
        .on('error', function (error) { callback(error); });
};

global.createErrorStream = function (error) {
  return new ErrorStream(error);
};
function ErrorStream(error) {
  process.nextTick(this.emit.bind(this, "error", error));
}
util.inherits(ErrorStream, Stream);
