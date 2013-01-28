alzheimer = require "../lib/alzheimer"
fs = require "fs"

describe "invoking alzheimer.remember", ->
  remember = alzheimer.remember

  describe "with a function returning a stream", ->
    f = sinon.spy fs.createReadStream
    remembered = remember f
    it "returns a function", ->
      remembered.should.be.a "function"

    describe "the returned function's first invocation", ->
      resultStream = null
      before (done) ->
        resultStream = remembered __filename, { encoding: "ascii" }
        readStream resultStream, done
      it "calls the original function on the first invocation", ->
        f.should.have.been.called
      it "returns the expected stream", ->
        resultStream.should.equal f.returnValues[0]

    describe "the returned function's second invocation", ->
      result = resultStream = null
      expected = fs.readFileSync __filename, "ascii"
      before (done) ->
        resultStream = remembered __filename
        readStream resultStream, (err, contents) ->
          result = contents
          done()
      it "does not call the original function on the second invocation", ->
        f.should.have.been.calledOnce
      it "returns a new stream", ->
        resultStream.should.not.equal f.returnValues[0]
      it "returns a stream with the same contents as the original", ->
        result.should.equal expected
      it "returns a stream with the same encoding as the original", ->
        resultStream._decoder.encoding.should.equal "ascii"
