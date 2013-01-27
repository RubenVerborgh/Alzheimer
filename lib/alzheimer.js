(function () {
  "use strict";

  var VALUE = 0,
      ERROR = 1;

  // Memoize the specified function
  function remember(func) {
    if (typeof func !== "function")
      throw new Error("alzheimer.remember: argument should be a function");

    // The memory that will remember the return values
    var memory = Object.create(null);

    // Return the memoized function
    return function (first) {
      // Determine the value if it is not yet in memory
      var memoryCell = memory[first];
      if (!memoryCell) {
        try {
          var value = func.apply(this, arguments);
          memoryCell = { type: VALUE, result: value };
        }
        catch (error) {
          memoryCell = { type: ERROR, result: error };
        }
        memory[first] = memoryCell;
      }

      // Perform the action based on original function result
      var result = memoryCell.result;
      switch (memoryCell.type) {
      // return the result returned by the original function
      case VALUE:
        return result;
      // throw the error thrown by the original function
      case ERROR:
        throw result;
      }
    };
  }

  // Export the alzheimer module
  module.exports =  { remember: remember };
})();
