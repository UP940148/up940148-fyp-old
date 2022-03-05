lib/three.module.js[36m:[mvar _[1;31mcanvas[m;
lib/three.module.js[36m:[m		var [1;31mcanvas[m;
lib/three.module.js[36m:[m			[1;31mcanvas[m = image;
lib/three.module.js[36m:[m			if ( _[1;31mcanvas[m === undefined ) _[1;31mcanvas[m = document.createElementNS( 'http://www.w3.org/1999/xhtml', '[1;31mcanvas[m' );
lib/three.module.js[36m:[m			_[1;31mcanvas[m.width = image.width;
lib/three.module.js[36m:[m			_[1;31mcanvas[m.height = image.height;
lib/three.module.js[36m:[m			var context = _[1;31mcanvas[m.getContext( '2d' );
lib/three.module.js[36m:[m			[1;31mcanvas[m = _[1;31mcanvas[m;
lib/three.module.js[36m:[m		if ( [1;31mcanvas[m.width > 2048 || [1;31mcanvas[m.height > 2048 ) {
lib/three.module.js[36m:[m			return [1;31mcanvas[m.toDataURL( 'image/jpeg', 0.6 );
lib/three.module.js[36m:[m			return [1;31mcanvas[m.toDataURL( 'image/png' );
lib/three.module.js[36m:[m	var _[1;31mcanvas[m;
lib/three.module.js[36m:[m			document.createElementNS( 'http://www.w3.org/1999/xhtml', '[1;31mcanvas[m' );
lib/three.module.js[36m:[m				if ( _[1;31mcanvas[m === undefined ) _[1;31mcanvas[m = createCanvas( width, height );
lib/three.module.js[36m:[m				// cube textures can't reuse the same [1;31mcanvas[m
lib/three.module.js[36m:[m				var [1;31mcanvas[m = needsNewCanvas ? createCanvas( width, height ) : _[1;31mcanvas[m;
lib/three.module.js[36m:[m				[1;31mcanvas[m.width = width;
lib/three.module.js[36m:[m				[1;31mcanvas[m.height = height;
lib/three.module.js[36m:[m				var context = [1;31mcanvas[m.getContext( '2d' );
lib/three.module.js[36m:[m				return [1;31mcanvas[m;
lib/three.module.js[36m:[m			// regular Texture (image, video, [1;31mcanvas[m)
lib/three.module.js[36m:[m	var _[1;31mcanvas[m = parameters.[1;31mcanvas[m !== undefined ? parameters.[1;31mcanvas[m : document.createElementNS( 'http://www.w3.org/1999/xhtml', '[1;31mcanvas[m' ),
lib/three.module.js[36m:[m	this.domElement = _[1;31mcanvas[m;
lib/three.module.js[36m:[m		_width = _[1;31mcanvas[m.width,
lib/three.module.js[36m:[m		_height = _[1;31mcanvas[m.height,
lib/three.module.js[36m:[m		_[1;31mcanvas[m.addEventListener( 'webglcontextlost', onContextLost, false );
lib/three.module.js[36m:[m		_[1;31mcanvas[m.addEventListener( 'webglcontextrestored', onContextRestore, false );
lib/three.module.js[36m:[m		_gl = _context || _[1;31mcanvas[m.getContext( 'webgl', contextAttributes ) || _[1;31mcanvas[m.getContext( 'experimental-webgl', contextAttributes );
lib/three.module.js[36m:[m			if ( _[1;31mcanvas[m.getContext( 'webgl' ) !== null ) {
lib/three.module.js[36m:[m		_[1;31mcanvas[m.width = Math.floor( width * _pixelRatio );
lib/three.module.js[36m:[m		_[1;31mcanvas[m.height = Math.floor( height * _pixelRatio );
lib/three.module.js[36m:[m			_[1;31mcanvas[m.style.width = width + 'px';
lib/three.module.js[36m:[m			_[1;31mcanvas[m.style.height = height + 'px';
lib/three.module.js[36m:[m		_[1;31mcanvas[m.width = Math.floor( width * pixelRatio );
lib/three.module.js[36m:[m		_[1;31mcanvas[m.height = Math.floor( height * pixelRatio );
lib/three.module.js[36m:[m		_[1;31mcanvas[m.removeEventListener( 'webglcontextlost', onContextLost, false );
lib/three.module.js[36m:[m		_[1;31mcanvas[m.removeEventListener( 'webglcontextrestored', onContextRestore, false );
lib/three.module.js[36m:[mfunction CanvasTexture( [1;31mcanvas[m, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy ) {
lib/three.module.js[36m:[m	Texture.call( this, [1;31mcanvas[m, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy );
package-lock.json[36m:[m        "[1;31mcanvas[m": "^2.5.0"
package-lock.json[36m:[m        "[1;31mcanvas[m": {
