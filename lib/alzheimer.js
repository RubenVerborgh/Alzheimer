(function () {
  "use strict";

  var fs = require("fs"),
      os = require("os"),
      Stream = require("stream");

  var VALUE = 0,
      ERROR = 1,
      STREAM = 2;

  // Create a temporary folder for remembered streams
  var tmpDir = os.tmpDir() + Math.random().toString(36) + '/';
  fs.mkdirSync(tmpDir);
  var tmpCounter = 0;

  // Memoize the specified function
  function remember(func) {
    if (typeof func !== "function")
      throw new Error("alzheimer.remember: argument should be a function");

    // The memory that will remember the return values
    var memory = Object.create(null);

    // Return the memoized function
    return function (first) {
      // Fetch the value if it exists in memory
      var memoryCell = memory[first], result, type;
      if (memoryCell) {
        result = memoryCell.result;
        type = memoryCell.type;
      }
      // Determine the value if it doesn't exist in memory yet
      else {
        // Try to make the cell a regular value
        try {
          result = func.apply(this, arguments);
          type = VALUE;
        }
        // If this failed, make the cell an error value
        catch (error) {
          result = error;
          type = ERROR;
        }
        memory[first] = memoryCell = { type: type, result: result };

        // If the result is a stream, make it a stream cell
        if (result instanceof Stream) {
          // Capture the stream in a file that will be played back later
          rememberStream(result, function (error, streamFile) {
            var encoding = result._decoder && result._decoder.encoding;
            memoryCell.result = { file: streamFile, encoding: encoding };
            memoryCell.type = STREAM;
          });
        }
      }

      // Perform the action based on original function result
      switch (type) {
      // return the result returned by the original function
      case VALUE:
        return result;
      // throw the error thrown by the original function
      case ERROR:
        throw result;
      // play back a captured stream
      case STREAM:
        return fs.createReadStream(result.file, { encoding: result.encoding });
      }
    };
  }

  // Capture the stream in a temporary file and return its name
  function rememberStream(stream, callback) {
    var tmpFile = tmpDir + tmpCounter++,
        tmpStream = fs.createWriteStream(tmpFile);
    stream.pipe(tmpStream);
    stream.on("end", callback.bind(null, null, tmpFile));
  }

  // Export the alzheimer module
  module.exports =  { remember: remember };
})();
