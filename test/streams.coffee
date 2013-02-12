alzheimer = require "../lib/alzheimer"
fs = require "fs"

describe "invoking alzheimer.remember", ->
  remember = alzheimer.remember

  describe "with a function returning a stream", ->
    f = sinon.spy (filename, options) ->
      stream = fs.createReadStream filename, options
      stream.dummy = 1
      stream
    remembered = remember f

    it "returns a function", ->
      remembered.should.be.a "function"

    describe "the returned function's first invocation", ->
      error = result = resultStream = null
      expected = fs.readFileSync __filename, "ascii"
      before (done) ->
        resultStream = remembered __filename, { encoding: "ascii" }
        readStream resultStream, (err, contents) ->
          error = err
          result = contents
          done()
      it "calls the original function", ->
        f.should.have.been.called
      it "returns a new stream", ->
        resultStream.should.not.equal f.returnValues[0]
      it "returns a stream with the same contents as the original", ->
        result.should.equal expected
      it "returns a stream with the same encoding as the original", ->
        resultStream._decoder.encoding.should.equal "ascii"
      it "returns a stream with the same properties as the original", ->
        resultStream.should.have.property "dummy", 1

    describe "the returned function's second invocation", ->
      error = result = resultStream = null
      expected = fs.readFileSync __filename, "ascii"
      before (done) ->
        resultStream = remembered __filename, { encoding: "ascii" }
        readStream resultStream, (err, contents) ->
          error = err
          result = contents
          done()
      it "does not call the original function", ->
        f.should.have.been.calledOnce
      it "does not return an error", ->
        should.not.exist error
      it "returns a new stream", ->
        resultStream.should.not.equal f.returnValues[0]
      it "returns a stream with the same contents as the original", ->
        result.should.equal expected
      it "returns a stream with the same encoding as the original", ->
        resultStream._decoder.encoding.should.equal "ascii"
      it "returns a stream with the same properties as the original", ->
        resultStream.should.have.property "dummy", 1

  describe "with a function returning an erroneous stream", ->
    f = sinon.spy (error) ->
      stream = createErrorStream(error)
      stream.dummy = 1
      stream

    remembered = remember f
    it "returns a function", ->
      remembered.should.be.a "function"

    describe "the returned function's first invocation", ->
      error = result = resultStream = null
      before (done) ->
        resultStream = remembered "nonexistent"
        readStream resultStream, (err, contents) ->
          error = err
          result = contents
          done()

      it "calls the original function", ->
        f.should.have.been.called
      it "does not return a value", ->
        should.not.exist result
      it "returns a new stream", ->
        resultStream.should.not.equal f.returnValues[0]
      it "returns a stream with the same error as the original", ->
        error.should.equal "nonexistent"
      it "returns a stream with the same properties as the original", ->
        resultStream.should.have.property "dummy", 1

    describe "the returned function's second invocation", ->
      error = result = resultStream = null
      before (done) ->
        resultStream = remembered "nonexistent"
        readStream resultStream, (err, contents) ->
          error = err
          result = contents
          done()

      it "does not call the original function", ->
        f.should.have.been.calledOnce
      it "does not return a value", ->
        should.not.exist result
      it "returns a new stream", ->
        resultStream.should.not.equal f.returnValues[0]
      it "returns a stream with the same error as the original", ->
        error.should.equal "nonexistent"
      it "returns a stream with the same properties as the original", ->
        resultStream.should.have.property "dummy", 1
