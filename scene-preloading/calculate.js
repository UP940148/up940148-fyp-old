import * as Rad from '../radiosity/index.js';
import { environmentsList } from '../frontend/environments-list.js';
import * as cliProgress from 'cli-progress';

const selected = parseInt(process.argv[2]) || 0;

let env = environmentsList[selected];
const name = env.id;

const alg = new Rad.SlowRad();

const progBar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const progBar2 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

main();

let bufferingIterator;

async function main() {
  await openEnv();
  bufferingIterator = await alg.open(env, name);
  await startBuffering();
}

async function startBuffering() {
  try {
    let next = await bufferingIterator.next();
    let max = next.value.max;
    let progBar = progBar1;
    progBar1.start(max, next.value.curr);
    while (!next.done) {
      if (!bufferingIterator) break;

      next = await bufferingIterator.next();
      if (next.value) {
        if (next.value.max !== max) {
          max = next.value.max;
          progBar1.stop();
          progBar = progBar2;
          progBar2.start(max, next.value.curr);
        }

        progBar.update(next.value.curr);
      }
    }
  } finally {
    bufferingIterator = null;
  }
  progBar2.stop();
}

async function openEnv() {
  env = await env.f();
}
