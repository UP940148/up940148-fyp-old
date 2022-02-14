
import * as Rad from '../../radiosity/index.js';
import Transform3 from '../transform3.js';
import * as Cube from '../cube.js';
import * as Plane from '../singleface.js';
import * as Cylinder from '../cylinder.js';
import * as Tree from '../tree.js';

const defaultReflectance  = new Rad.Spectra(1,1,1);
const defaultEmittance = new Rad.Spectra(0,0,0);

// Create a room with a light
export default function createScene() {
    /*
        MATRIX TRANSFORMATION ORDER (SRT):
        1) Scale
        2) Rotate
        3) Translate
    */
    const trees = Tree.tree();




    // Return environment with scene objects
    return new Rad.Environment(trees);
}
