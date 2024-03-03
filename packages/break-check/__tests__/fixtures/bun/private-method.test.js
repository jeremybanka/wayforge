import { describe, it, expect } from "bun:test";
import MyClass from "./src.js";

describe('MyClass Private API Test', function() {
  it('should test privateMethod', function() {
    const obj = new MyClass();
    expect(obj.privateMethod()).toBe("private");
  });
});