class PathHandler {
  constructor() {
    this.handlersByType = {};
  }

  addHandler(type, handler) {
    if (!type) {
      throw new Error("A type must be provided.");
    }

    if (!handler) {
      throw new Error("A handler must be provided.");
    }

    if (!this.handlersByType[type]) {
      this.handlersByType[type] = [handler];
      return;
    }

    this.handlersByType[type].push(handler);
  }

  handle(path) {
    if (path && this.handlersByType[path.type]) {
      this.handlersByType[path.type].forEach(callback => callback(path));
    }
  }
}

module.exports = PathHandler;
