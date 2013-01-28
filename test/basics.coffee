alzheimer = require "../lib/alzheimer"

describe "the alzheimer module", ->
  it "is an object", ->
    alzheimer.should.be.an "object"
  it "contains a remember function", ->
    alzheimer.should.have.property "remember"
    alzheimer.remember.should.be.a "function"

describe "invoking alzheimer.remember", ->
  remember = alzheimer.remember

  describe "without arguments", ->
    it "throws an error", ->
      (-> remember()).should.throw "alzheimer.remember: argument should be a function"

  describe "with a non-function argument", ->
    it "throws an error", ->
      (-> remember()).should.throw "alzheimer.remember: argument should be a function"

  describe "with a 0-argument function returning a primitive", ->
    f = sinon.stub().returns 42
    remembered = remember f
    it "returns a function", ->
      remembered.should.be.a "function"
    describe "the returned function's first invocation", ->
      result = remembered()
      it "calls the original function on the first invocation", ->
        f.should.have.been.called
      it "returns the original function's value", ->
        result.should.equal 42
    describe "the returned function's second invocation", ->
      result = remembered()
      it "does not call the original function on the second invocation", ->
        f.should.have.been.calledOnce
      it "returns the original function's value", ->
        result.should.equal 42

  describe "with a 1-argument function returning a primitive", ->
    f = sinon.spy (x) -> x + 1
    remembered = remember f
    it "returns a function", ->
      remembered.should.be.a "function"
    describe "the returned function's first invocation with 1", ->
      result = remembered(1)
      it "calls the original function on the first invocation with 1", ->
        f.should.have.been.called
      it "returns the original function's value for (1)", ->
        result.should.equal 2
    describe "the returned function's second invocation with (1)", ->
      result = remembered(1)
      it "does not call the original function on the second invocation with (1)", ->
        f.should.have.been.calledTwice # in total
      it "returns the original function's value for (1)", ->
        result.should.equal 2
    describe "the returned function's first invocation with (2)", ->
      result = remembered(2)
      it "calls the original function on the first invocation with (2)", ->
        f.should.have.been.called
      it "returns the original function's value for (2)", ->
        result.should.equal 3
    describe "the returned function's second invocation with (2)", ->
      result = remembered(2)
      it "does not call the original function on the second invocation with (2)", ->
        f.should.have.been.calledTwice # in total
      it "returns the original function's value for (2)", ->
        result.should.equal 3

  describe "with a 2-argument function returning a primitive", ->
    f = sinon.spy (x, y) -> x + y
    remembered = remember f
    it "returns a function", ->
      remembered.should.be.a "function"
    describe "the returned function's first invocation with (1, 1)", ->
      result = remembered(1, 1)
      it "calls the original function on the first invocation with (1, 1)", ->
        f.should.have.been.called
      it "returns the original function's value for (1, 1)", ->
        result.should.equal 2
    describe "the returned function's second invocation with (1, 1)", ->
      result = remembered(1, 1)
      it "does not call the original function on the second invocation with (1, 1)", ->
        f.should.have.been.calledTwice # in total
      it "returns the original function's value for (1, 1)", ->
        result.should.equal 2
    describe "the returned function's first invocation with (2, 1)", ->
      result = remembered(2, 1)
      it "calls the original function on the first invocation with (2, 1)", ->
        f.should.have.been.called
      it "returns the original function's value for (2, 1)", ->
        result.should.equal 3
    describe "the returned function's second invocation with (2, 1)", ->
      result = remembered(2, 1)
      it "does not call the original function on the second invocation with (2, 1)", ->
        f.should.have.been.calledTwice # in total
      it "returns the original function's value for (2, 1)", ->
        result.should.equal 3

  describe "with a function throwing an error", ->
    error = new Error "error"
    f = sinon.stub().throws error
    remembered = remember f
    it "returns a function", ->
      remembered.should.be.a "function"
    describe "the returned function's first invocation", ->
      try
        result = remembered()
      catch e
        caught = e
      it "calls the original function on the first invocation", ->
        f.should.have.been.called
      it "throws the original function's error", ->
        caught.should.equal error
    describe "the returned function's second invocation", ->
      try
        result = remembered()
      catch e
        caught = e
      it "does not call the original function on the second invocation", ->
        f.should.have.been.calledOnce
      it "throws the original function's error", ->
        caught.should.equal error
