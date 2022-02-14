import * as Rad from '../radiosity/index.js';
import * as Sub from './subdivision.js';
import * as Cylinder from './cylinder.js';
import * as Cube from './cube.js';
import Transform3 from './transform3.js';


/*
 * Create a tree with height h and base width w
 * The tree has a hell of a lot of surfaces. So let's see how this goes
 */
export function tree(n = 8, h = 5, w = .8, subdivide = 1, depth = 0) {
    const segmentHeight = h/3;
    const segments = [];
    const branches = [];
    let currentBase = w;
    let currentTop;
    // For each segment
    for (let i = 0; i < 3; i++) {
        // Trunk segments
        // Create a new cylinder
        currentTop = currentBase * .75;
        segments.push(Cylinder.cylinder(n, currentBase, currentTop, segmentHeight, subdivide));
        // Calculate width 2 thirds up segment
        let thirdWidth = ((currentTop - currentBase) * 2 / 3) + currentBase
        currentBase = currentTop;
        let xForm = new Transform3();
        xForm.translate(0,0,segmentHeight*i);
        xForm.transform(segments[i]);

        segments[i].surfaces.forEach(surface => {
            surface.reflectance.add(new Rad.Spectra(0.34, .18, 0));
            surface.emittance.add(new Rad.Spectra(0.17, .09, 0));
        })

        for (let j = 0; j < i+1; j++) {
            // Create branch half way up
            let branch = Cylinder.cylinder(n, thirdWidth/2, thirdWidth/4, segmentHeight*3/4, subdivide)
            let branchxForm = new Transform3();

            branch.surfaces.forEach(surface => {
                surface.reflectance.add(new Rad.Spectra(0.33, .17, 0));
                surface.emittance.add(new Rad.Spectra(0.165, .085, 0));
            })

            let baseAngle = 120 * (j + Math.random());

            branchxForm.rotate(0, 60, baseAngle);
            let r = .3;
            let radAngle = baseAngle * Math.PI / 180;
            let xPos = r * Math.cos(radAngle);
            let yPos = r * Math.sin(radAngle);
            branchxForm.translate(xPos, yPos, segmentHeight*i + segmentHeight/2);
            branchxForm.transform(branch);

            branches.push(branch);

            // Leaves
            let leaf = Cube.unitCubeMultiSurface();
            let leafxForm = new Transform3();
            leafxForm.translate(-.5, -.5, 0);
            leafxForm.scale(.6,.6,.6);
            leafxForm.rotate(30, 30, 0);
            leafxForm.translate(0,0, segmentHeight *.75);
            leafxForm.rotate(0, 60, baseAngle);
            leafxForm.translate(xPos, yPos, segmentHeight*i + segmentHeight/2);
            leafxForm.transform(leaf);

            leaf.surfaces.forEach(surface => {
                surface.reflectance.add(new Rad.Spectra(0.20, .34, 0));
                surface.emittance.add(new Rad.Spectra(0.1, .17, 0));
            })

            branches.push(leaf);

        }




    }

    return segments.concat(branches);
}
