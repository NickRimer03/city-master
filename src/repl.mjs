export default class Repl {
  constructor() {
    this.__events = {};
  }

  subscribe(eventName, fn) {
    if (!this.__events[eventName]) {
      this.__events[eventName] = [];
    }

    this.__events[eventName].push(fn);

    return () => {
      this.__events[eventName] = this.__events[eventName].filter(eventFn => fn !== eventFn);
    };
  }

  emit(eventName, data) {
    const event = this.__events[eventName];
    if (event) {
      event.forEach(fn => {
        fn.call(null, data);
      });
    }
  }

  on({ author, channel, cmd, args }) {
    switch (cmd) {
      case "c":
        this.emit("event--clear", { channel });
        break;
    }
  }
}
