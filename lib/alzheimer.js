(function () {
  "use strict";

  var fs = require("fs"),
      os = require("os"),
      util = require("util"),
      Stream = require("stream");

  var VALUE = 0,
      ERROR = 1,
      STREAM = 2,
      ERRORSTREAM = 3,
      FULLFILLEDPROMISE = 4;

  // Create a temporary folder for remembered streams
  var tmpDir = os.tmpDir() + Math.random().toString(36) + '/';
  fs.mkdirSync(tmpDir);
  var tmpCounter = 0;

  // Empty function
  var noop = function () {};

  // Memoize the specified function
  function remember(func) {
    if (typeof func !== "function")
      throw new Error("alzheimer.remember: argument should be a function");

    // The memory that will remember the return values
    var memory = Object.create(null);

    // Return the memoized function
    return function (firstArg) {
      // Fetch the value if it exists in memory
      var memoryCell = memory[firstArg];
      // Determine the value if it doesn't exist in memory yet
      if (!memoryCell) {
        // Try to make the cell a regular value
        try {
          memoryCell = createMemoryCell(VALUE, func.apply(this, arguments));
        }
        // If `func` failed, make the cell an error value
        catch (error) {
          memoryCell = createMemoryCell(ERROR, error);
        }
        memory[firstArg] = memoryCell;
      }
      return getMemoryCellContents(memoryCell);
    };
  }

  // Extract an actualized result from a memory cell
  function getMemoryCellContents(memoryCell) {
    var result = memoryCell.result;
    // Perform the action based on original function result
    switch (memoryCell.type) {
    // return the result returned by the original function
    case VALUE:
      return result;
    // throw the error thrown by the original function
    case ERROR:
      throw result;
    // play back a captured stream
    case STREAM:
      return fs.createReadStream(result.file, { encoding: result.encoding });
    // play back an erroneous stream
    case ERRORSTREAM:
      return new ErrorStream(result);
    // return a fulfilled promise
    case FULLFILLEDPROMISE:
      return result.promise.then(function () {
        return getMemoryCellContents(result.resultCell);
      });
    }
  }

  // Create a memory cell for a function's result
  function createMemoryCell(type, result) {
    // First, create a regular memory cell
    var memoryCell = { type: type, result: result };

    // Next, perform specific transformations depending on the result
    if (type === VALUE) {
      // If the result is a stream, capture it for later playback
      if (result instanceof Stream) {
        // Capture the stream in a file that will be played back later
        cacheStream(result, function (error, streamFile) {
          // Make the cell an error value if the original stream errors
          if (error) {
            memoryCell.result = error;
            memoryCell.type = ERRORSTREAM;
          }
          // Otherwise, make it a stream cell
          else {
            var encoding = result._decoder && result._decoder.encoding;
            memoryCell.result = { file: streamFile, encoding: encoding };
            memoryCell.type = STREAM;
          }
        });
      }
      // If the result is a promise, capture its value
      if (result && typeof(result.then) === "function") {
        result.then(function (promiseResult) {
          var resultCell = createMemoryCell(VALUE, promiseResult);
          memoryCell.type = FULLFILLEDPROMISE;
          memoryCell.result = { promise: result, resultCell: resultCell };
        });
      }
    }

    // Return the created memory cell
    return memoryCell;
  }

  // Capture the stream in a temporary file and return its name
  function cacheStream(stream, callback) {
    var tmpFile = tmpDir + tmpCounter++,
        tmpStream = fs.createWriteStream(tmpFile);
    stream.pipe(tmpStream);
    stream.on("end", callback.bind(null, null, tmpFile));
    stream.on("error", callback);
  }

  // A stream that emits the specified error
  function ErrorStream(error) {
    this.pause = this.resume = noop;
    process.nextTick(this.emit.bind(this, "error", error));
  }
  util.inherits(ErrorStream, Stream);

  // Export the alzheimer module
  module.exports =  { remember: remember };
})();
