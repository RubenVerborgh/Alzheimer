(function () {
  "use strict";

  var fs = require("fs"),
      path = require("path"),
      os = require("os"),
      util = require("util"),
      Stream = require("stream");

  var VALUE = 0,
      ERROR = 1,
      STREAM = 2,
      ERRORSTREAM = 3,
      FULLFILLEDPROMISE = 4;

  // Create a temporary folder for remembered streams
  var tmpDir = path.join(os.tmpDir(), Math.random().toString(36)) + '/';
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
      // Read the stream from disk, but give it the properties of the original stream
      var stream = fs.createReadStream(result.file, { encoding: result.encoding });
      return PlaceholderStream.call(stream, result.stream);
    // Play back an erroneous stream
    case ERRORSTREAM:
      stream = new PlaceholderStream(result.stream);
      process.nextTick(stream.emit.bind(stream, "error", result.error));
      return stream;
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
        // Until the stream is fully captured, shield it off with a temporary placeholder
        var placeholderStream = new PlaceholderStream(result);
        memoryCell.result = placeholderStream;

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
          // Play back the resulting stream in the placeholder
          placeholderStream._streamFrom(getMemoryCellContents(memoryCell));
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

  // A stream that serves as a placeholder value until another stream is ready
  function PlaceholderStream(baseStream) {
    // Inherit from the base stream, but don't inherit its listeners
    var originalPrototype = this.__proto__;
    this.__proto__ = Object.create(baseStream);
    this._events = {};

    // Restore all properties of the original prototype
    for (var propertyName in originalPrototype)
      this[propertyName] = originalPrototype[propertyName];

    // Imitate the specified stream's behavior by reacting to its stream events
    this._streamFrom = function (stream) {
      stream._events = this._events;
    };

    // Return ourself in case we're not called as a constructor
    return this;
  }
  util.inherits(PlaceholderStream, Stream);

  // Export the alzheimer module
  module.exports =  { remember: remember };
})();
