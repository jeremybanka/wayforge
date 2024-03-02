const { describe, it } = require('node:test');

const assert = require('assert').strict;
const MyClass = require('./src.mjs');

describe('MyClass Private API Test', function() {
  it('should test privateMethod', function() {
    const obj = new MyClass();
    assert.strictEqual(obj.privateMethod(), "private");
  });
});