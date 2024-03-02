class MyClass {
  constructor() {
    this.privateVar = "private";
  }

  publicMethod() {
    return "publicMethodOutput";
  }

  privateMethod() {
    return this.privateVar;
  }
}

module.exports = MyClass;