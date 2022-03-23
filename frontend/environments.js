import * as components from './tools/basic-components.js';
import { environmentsList } from '../frontend/environments-list.js';

export const selector = new components.Selector('environment', environmentsList);

async function createEnvironment() {
  const environment = await selector.value.f();
  const name = await selector.value.id;

  if (!environment.checkNoVerticesAreShared()) {
    console.warn(`environment ${selector.value.name} has vertices shared between surfaces and it should not!`);
  }

  if (listener) listener(environment, name);
}


export function setup() {
  createEnvironment();

  selector.addEventListener('change', () => {
    createEnvironment();
  });
}


let listener;

export function onEnvironmentChange(f) {
  listener = f;
}
