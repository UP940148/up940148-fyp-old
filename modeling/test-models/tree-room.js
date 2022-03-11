import * as TreeLoader from '../json-tree-loader.js';
import * as Rad from '../../radiosity/index.js';

export default async function createScene() {
  const tree1 = await TreeLoader.load('../modeling/trees/tree.json');
  // console.log(tree1);

  return new Rad.Environment([tree1]);
}
