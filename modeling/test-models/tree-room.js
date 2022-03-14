import * as TreeLoader from '../json-tree-loader.js';
import * as Rad from '../../radiosity/index.js';

export default async function createScene() {
  const tree1 = await TreeLoader.load('../modeling/trees/r30N2000.json');
  const tree2 = await TreeLoader.load('../modeling/trees/r30N2000.json');
  const tree3 = await TreeLoader.load('../modeling/trees/r30N2000.json');
  const tree4 = await TreeLoader.load('../modeling/trees/r30N2000.json');
  const tree5 = await TreeLoader.load('../modeling/trees/r30N2000.json');
  const tree6 = await TreeLoader.load('../modeling/trees/r30N2000.json');
  const tree7 = await TreeLoader.load('../modeling/trees/r30N2000.json');

  // console.log(tree1);

  return new Rad.Environment([tree1, tree2, tree3, tree4, tree5, tree6, tree7]);
}
