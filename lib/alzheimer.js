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
  function remember(func, options) {
    if (typeof func !== "function")
      throw new Error("alzheimer.remember: argument should be a function");

    // The memory that will remember the return values
    var memory = Object.create(null);

    // Set options
    var forget = !!(options && options.forget);
    if (forget && options.forget.after) {
      var maxAge = options.forget.after;
      // Sweep the memory in fixed intervals
      setInterval(function () {
        // Remove memory cells that are older than allowed
        var minTimeStamp = Date.now() - maxAge;
        for (var key in memory) {
          var memoryCell = memory[key];
          if (memoryCell.timestamp <= minTimeStamp) {
            delete memory[key];
            eraseMemoryCell(memoryCell);
          }
        }
      }, 1000);
    }

    // Return the memoized function
    return function (firstArg) {
      // Fetch the value if it exists in memory
      var memoryCell = memory[firstArg];
      // Determine the value if it doesn't exist in memory yet
      if (!memoryCell) {
        // Try to make the cell a regular value
        try {
          memoryCell = createMemoryCell(VALUE, func.apply(this, arguments), forget);
        }
        // If `func` failed, make the cell an error value
        catch (error) {
          memoryCell = createMemoryCell(ERROR, error, forget);
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
    // Return the result returned by the original function
    case VALUE:
      return result;
    // Throw the error thrown by the original function
    case ERROR:
      throw result;
    // Play back a captured stream
    case STREAM:
      // Read the stream from disk
      var stream = fs.createReadStream(result.file, { encoding: result.encoding });
      // Add the properties from the original stream…
      stream.__proto__ = result.stream;
      // …but reset the listeners
      stream._events = {};
      return stream;
    // Play back an erroneous stream
    case ERRORSTREAM:
      return new ErrorStream(result.error, result.stream);
    // Return a fulfilled promise
    case FULLFILLEDPROMISE:
      return result.promise.then(function () {
        return getMemoryCellContents(result.resultCell);
      });
    }
  }

  // Create a memory cell for a function's result
  function createMemoryCell(type, result, addTimestamp) {
    // First, create a regular memory cell
    var memoryCell = { type: type, result: result };
    if (addTimestamp)
      memoryCell.timestamp = Date.now();

    // Next, perform specific transformations depending on the result
    if (type === VALUE) {
      // If the result is a stream, capture it for later playback
      if (result instanceof Stream) {
        // Capture the stream in a file that will be played back later
        cacheStream(result, function (error, streamFile) {
          // Make the cell an error value if the original stream errors
          if (error) {
            memoryCell.result = { error: error, stream: result };
            memoryCell.type = ERRORSTREAM;
          }
          // Otherwise, make it a stream cell
          else {
            var encoding = result._decoder && result._decoder.encoding;
            memoryCell.result = { file: streamFile, encoding: encoding, stream: result };
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

  // Clean up the memory cell
  function eraseMemoryCell(memoryCell) {
    var result = memoryCell.result;
    switch (memoryCell.type) {
    // Delete a cached stream, leaving some time for readers to finish
    case STREAM:
      return setTimeout(fs.unlink.bind(fs, result.file), 1000);
    // Delete the promise's memory cell
    case FULLFILLEDPROMISE:
      return eraseMemoryCell(result.resultCell);
    }
  }

  // A stream that emits the specified error
  function ErrorStream(error, baseStream) {
    // Add the properties from the base stream…
    this.__proto__ = baseStream;
    // …but reset the listeners
    this._events = {};
    // Emit the error event ASAP
    process.nextTick(this.emit.bind(this, "error", error));
  }
  util.inherits(ErrorStream, Stream);

  // Export the alzheimer module
  module.exports =  { remember: remember };
})();
