import fs from 'fs'
import { dirname as getDirName } from 'path'
export default class File {
  async append(fileName, data, cb = (err) => err && console.trace(err)){
    if(fs.existsSync(getDirName(fileName))){
      await fs.appendFileSync(fileName,`${new Date().toLocaleString('pt-br')} ${data}\n`, cb)
      return true;
    }else{
      await fs.mkdirSync(getDirName(fileName), {recursive: true})
      return this.append(fileName, data, cb);
    }
  }
}