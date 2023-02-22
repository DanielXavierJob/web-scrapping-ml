import console from './stackTrace.js'
const getArg =  (argName, required = false) => {
  const arg = process.argv.find((arg) => arg.includes(argName));
  if (arg) return arg.includes("=") ? arg.split(argName)[1] : arg;

  if(required){
    console.trace("Arg `"+argName+"` is required")
  }
  return null;
}
export default getArg