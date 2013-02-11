alzheimer = require "../lib/alzheimer"

describe "invoking alzheimer.remember", ->
  remember = alzheimer.remember

  describe "with the forget option", ->
    clock = sinon.useFakeTimers()
    f = sinon.stub().returns 42
    forgetTime = 60 * 1000
    remembered = remember f, forget: { after: forgetTime }

    after -> clock.restore()

    it "returns a function", ->
      remembered.should.be.a "function"

    describe "when no time has passed", ->
      describe "the returned function's first invocation", ->
        result = before -> result = remembered 1
        it "calls the original function", ->
          f.should.have.been.called
        it "returns the original function's value", ->
          result.should.equal 42
      describe "the returned function's second invocation", ->
        result = before -> result = remembered 1
        it "does not call the original function", ->
          f.should.have.been.calledOnce
        it "returns the original function's value", ->
          result.should.equal 42

    describe "when forget time has passed", ->
      before (done) ->
        setTimeout done, forgetTime
        clock.tick forgetTime

      describe "the returned function's third invocation", ->
        result = before -> result = remembered 1
        it "calls the original function", ->
          f.should.have.been.calledTwice
        it "returns the original function's value", ->
          result.should.equal 42

      describe "the returned function's fourth invocation", ->
        result = before -> result = remembered 1
        it "does not call the original function", ->
          f.should.have.been.calledTwice
        it "returns the original function's value", ->
          result.should.equal 42
