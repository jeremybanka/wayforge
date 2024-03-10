import { describe, it, expect } from "bun:test";
import MyClass from "./src.js";

describe('MyClass Private API Test', () => {
  it('should test privateMethod', () => {
    const obj = new MyClass();
    expect(obj.privateMethod()).toBe("private");
  });
});