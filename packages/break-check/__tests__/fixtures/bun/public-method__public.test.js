import { describe, it, expect } from "bun:test";
import MyClass from "./src.js";

describe('MyClass Public API Test', () => {
  it('should test publicMethod', () => {
    const obj = new MyClass();
    expect(obj.publicMethod()).toBe("publicMethodOutput");
  });
});