# Alzheimer
Alzheimer is a JavaScript memoization library for Node with support for streams and promises.

**How can I speed up a slow function?**
<br>
You might want to _memoize_ it.
This means you put a wrapper around it that _caches_ the function's result
so it can answer subsequent calls _faster_.

**What does a memoization library do?**
<br>
A memoization library such as Alzheimer creates this wrapper for you.

**How does Alzheimer differ from other memoization libraries?**
<br>
The difference from other libraries such as
[memo](https://github.com/akidee/memo.js/),
[memoize](https://github.com/stagas/memoize)
and [memoizer](https://github.com/rook2pawn/node-memoizer)
is that Alzheimer also memoizes:

- **[streams](http://nodejs.org/api/stream.html)** by caching their contents on disk
- **[promises](http://promises-aplus.github.com/promises-spec/)** that return a stream

## Usage
### Installation
```bash
$ npm install alzheimer
```
### API
The `alzheimer` module exposes an object with a single function `remember(func, options)`.
<br>
Call `remember` with your function to retrieve a memoized version.
<br>
Memoized items can expire by setting `options` to `{ forget: { after: 60000 } }`,
where `60000` is the number of milliseconds an item can live.

## Examples
### Memoizing computation-intensive functions
This example illustrates how Alzheimer speeds up results by memoizing a function.
```javascript
// Calculates a computation-intensive hash
function calculateBigHash(number) {
  for (var i = 1, result = 0; i < 20000; i++)
    for (var j = 2; j < 10000; j++)
      result = (result + number) * i % (j + 13);
  return result;
}

// Both calculations below take equal time
calculateBigHash(5)
calculateBigHash(5)

// Now create a memoized version of the function
var remember = require("alzheimer").remember;
computeBigHash = remember(computeBigHash);
// Only the first calculation below takes some time,
// The second and third ones return immediately
calculateBigHash(5)
calculateBigHash(5)
calculateBigHash(5)

```

### Memoizing promises and streams
This example shows how Alzeimer can cache a stream resulting from a promise.
The stream is actually played back, as the HTTP response is cached to disk.
We also see that the cache can be kept fresh by demanding expiration.

```javascript
var http = require("http"),
    promiscuous = require("promiscuous") /* or any Promise/A+ library */,
    remember = require("alzheimer").remember;

// Creates a promise to a stream of the specified HTTP resource
function request(url) {
  console.log("Downloading", url);
  var deferred = promiscuous.deferred();
  http.get(url, deferred.resolve);
  return deferred.promise;
};

// Memoize results of the `request` function for 2500 ms
var rememberedRequest = remember(request, { forget: { after: 2500 } });

// The first request will require a download
setTimeout(function () {
  console.log("Request 1");
  rememberedRequest("http://amazon.com/").then(function (response) {
    response.on("end", console.log.bind(console, "Response 1"));
  });
}, 100);

// This request won't require a download
setTimeout(function () {
  console.log("Request 2");
  rememberedRequest("http://amazon.com/").then(function (response) {
    response.on("end", console.log.bind(console, "Response 2"));
  });
}, 1000);

// This request won't require a download
setTimeout(function () {
  console.log("Request 3");
  rememberedRequest("http://amazon.com/").then(function (response) {
    response.on("end", console.log.bind(console, "Response 3"));
  });
}, 2000);

// This request will require a download again, since the cache result expired
setTimeout(function () {
  console.log("Request 4");
  rememberedRequest("http://amazon.com/").then(function (response) {
    response.on("end", console.log.bind(console, "Response 4"));
  });
}, 3000);
```

## License
Copyright ©2013 Ruben Verborgh – MIT Licensed
