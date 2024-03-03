import { describe, it, expect } from "bun:test";
import MyClass from "./src.js";

describe('MyClass Public API Test', function() {
  it('should test publicMethod', function() {
    const obj = new MyClass();
    expect(obj.publicMethod()).toBe("publicMethodOutput");
  });
});