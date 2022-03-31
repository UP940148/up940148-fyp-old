import * as fs from 'fs';
import { resolve } from 'path';

// path is the path to the file from ROOT/scene-loading
export default function retrieve(path) {
  const fullPath = resolve(process.cwd(), path);
  const data = fs.readFileSync(fullPath);
  return JSON.parse(data);
}
