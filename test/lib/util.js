global.readStream = function (stream, callback) {
  var result = "";
  stream.on('data',  function (data)  { result += data; })
        .on('end',   function ()      { callback(null, result); })
        .on('error', function (error) { callback(error); });
};
