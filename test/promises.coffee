alzheimer = require "../lib/alzheimer"
fs = require "fs"
promiscuous = require "promiscuous"

describe "invoking alzheimer.remember", ->
  remember = alzheimer.remember

  describe "with a function returning a fulfilled promise", ->
    f = sinon.spy promiscuous.resolve

    remembered = remember f
    it "returns a function", ->
      remembered.should.be.a "function"

    describe "the returned function's first invocation", ->
      result = remembered 42
      before (done) ->
        result.then done()
      it "calls the original function on the first invocation", ->
        f.should.have.been.called
      it "returns the original function's result", ->
        result.should.equal f.returnValues[0]

    describe "the returned function's second invocation", ->
      result = remembered 42
      before (done) ->
        result.then done()
      it "does not call the original function on the first invocation", ->
        f.should.have.been.calledOnce
      it "returns the original function's result", ->
        result.should.equal f.returnValues[0]


  describe "with a function returning a rejected promise", ->
    f = sinon.spy promiscuous.reject

    remembered = remember f
    it "returns a function", ->
      remembered.should.be.a "function"

    describe "the returned function's first invocation", ->
      result = remembered "error"
      before (done) ->
        result.then (->), -> done()
      it "calls the original function on the first invocation", ->
        f.should.have.been.called
      it "returns the original function's result", ->
        result.should.equal f.returnValues[0]

    describe "the returned function's second invocation", ->
      result = remembered "error"
      before (done) ->
        result.then (->), -> done()
      it "does not call the original function on the first invocation", ->
        f.should.have.been.calledOnce
      it "returns the original function's result", ->
        result.should.equal f.returnValues[0]


  describe "with a function returning a promised stream", ->
    f = sinon.spy createPromisedStream

    remembered = remember f
    it "returns a function", ->
      remembered.should.be.a "function"

    describe "the returned function's first invocation", ->
      expected = resultStream = null
      before (done) ->
        remembered(__filename, { encoding: "ascii" }).then (result) ->
          resultStream = result
          readStream resultStream, done
          f.returnValues[0].then (value) -> expected = value
      it "calls the original function on the first invocation", ->
        f.should.have.been.called
      it "returns the expected stream", ->
        resultStream.should.equal expected

    describe "the returned function's second invocation", ->
      error = result = resultStream = null
      expected = fs.readFileSync __filename, "ascii"
      before (done) ->
        value = remembered __filename
        remembered(__filename).then (value) ->
          resultStream = value
          readStream resultStream, (err, contents) ->
            error = err
            result = contents
            done()
      it "does not call the original function on the second invocation", ->
        f.should.have.been.calledOnce
      it "does not return an error", ->
        should.not.exist error
      it "returns a new stream", ->
        resultStream.should.not.equal f.returnValues[0]
      it "returns a stream with the same contents as the original", ->
        result.should.equal expected
      it "returns a stream with the same encoding as the original", ->
        resultStream._decoder.encoding.should.equal "ascii"
