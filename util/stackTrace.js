import File from "./file.js";
async function stackTrace(text, type, stack = false) {
  var err = stack ? new Error(text) : { stack: `Error: ${text}` };
  const fileError = new File();
  await fileError.append(
    `./log/stack/${type}/${new Date().getDay()} - ${new Date().getFullYear()}.log`,
    err.stack
      .toString()
      .replace("Error: ", `${type.charAt(0).toUpperCase() + type.slice(1)}: `)
  );
  return err.stack;
}
console.trace = async function (...args) {
  for (var arg in args) {
    const element = args[arg];
    if (typeof element === "object") {
      stackTrace(element.value, "trace", element.stack || true);
      console.log(`Trace: ${element.stack}`);
    } else {
      stackTrace(element, "trace", true);
      console.log(`Trace: ${element}`);
    }
  }
  process.exit(1);
};

console.error = async function (...args) {
  for (var arg in args) {
    const element = args[arg];
    if (typeof element === "object") {
      stackTrace(element.value, "error", element.stack);
      console.log(`Error: ${element}`);
    } else {
      stackTrace(element, "error");
      console.log(`Error: ${element}`);
    }
  }
};

console.warn = async function (...args) {
  for (var arg in args) {
    const element = args[arg];
    if (typeof element === "object") {
      stackTrace(element.value, "warn", element.stack);
      console.log(`Warning: ${element}`);
    } else {
      stackTrace(element, "warn");
      console.log(`Warning: ${element}`);
    }
  }
};

console.show = async function (...args) {
  for (var arg in args) {
    const element = args[arg];
    if (typeof element === "object") {
      stackTrace(element.value, "log", element.stack);
      console.log(`Log: ${element.value}`);
    } else {
      stackTrace(args[arg], "log");
      console.log(`Log: ${element}`);
    }
  }
};
export default console;
