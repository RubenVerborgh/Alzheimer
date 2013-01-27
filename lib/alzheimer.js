(function () {
  "use strict";

  // Memoize the specified function
  function remember(func) {
    if (typeof func !== "function")
      throw new Error("alzheimer.remember: argument should be a function");

    // The memory that will remember the return values
    var memory = Object.create(null);

    // Return the memoized function
    return function (first) {
      // Calculate the value if it is not yet in memory
      if (!(first in memory))
        memory[first] = func.apply(this, arguments);

      // Return the value from memory
      return memory[first];
    };
  }

  // Export the alzheimer module
  module.exports =  { remember: remember };
})();
