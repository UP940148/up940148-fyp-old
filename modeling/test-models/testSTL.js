import { loadSTL } from '../stl-loader.js';
import * as Rad from '../../radiosity/index.js';

import Transform3 from '../transform3.js';

export default async function loadModel() {
    const modelColour = new Rad.Spectra(255, 0, 255).scale(1/255);
    const model = await loadSTL('../modeling/stl-models/basic-house1.stl', modelColour, null, 10, false);

    const xForm = new Transform3();
    xForm.scale(.05,.05,.05);
    xForm.transform(model);

    return new Rad.Environment([model]);
}
