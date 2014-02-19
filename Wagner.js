var WAGNER = WAGNER || {};

WAGNER.log = function( msg ) {
	console.log( msg );
}

WAGNER.Composer = function( renderer, settings ) {

	this.width = 1;
	this.height = 1;

	this.settings = settings || {};
	this.useRGBA = this.settings.useRGBA || false;
	this.vertexShadersPath = this.settings.vertexShadersPath || 'vertex-shaders';
	this.fragmentShadersPath = this.settings.fragmentShadersPath || 'vertex-shaders';	

	this.renderer = renderer;
	this.copyPass = new WAGNER.CopyPass();

	this.scene = new THREE.Scene();
	this.quad = new THREE.Mesh(
		new THREE.PlaneGeometry( 1, 1 ),
		this.defaultMaterial
	);
	this.scene.add( this.quad );
	this.camera = new THREE.OrthographicCamera( 1, 1, 1, 1, -10000, 10000 );

	this.front = new THREE.WebGLRenderTarget( 1, 1, { 
		minFilter: THREE.LinearFilter, 
		magFilter: THREE.LinearFilter, 
		format: this.useRGBA?THREE.RGBAFormat:THREE.RGBFormat
	} );
	
	this.back = this.front.clone();

	this.startTime = Date.now();

	this.passes = {};

}

WAGNER.Composer.prototype.linkPass = function( id, pass ) {

	function WagnerLoadPassException( message ) {
		this.message = 'Pass "' + id + '" already loaded.';
		this.name = "WagnerLoadPassException";
		this.toString = function() {
			return this.message
		};
	}
	
	if( this.passes[ id ] ) {
		throw new WagnerLoadPassException( id, pass );
		return;
	}

	this.passes[ id ] = pass;

}

WAGNER.Composer.prototype.swapBuffers = function() {

	this.output = this.write;
	this.input = this.read;

	var t = this.write;
	this.write = this.read;
	this.read = t;

}

WAGNER.Composer.prototype.render = function( scene, camera, keep ) {

	if( this.copyPass.isLoaded() ) {
		if( keep ) this.swapBuffers();
		this.renderer.render( scene, camera, this.write, true );
		this.swapBuffers();
	}

}

WAGNER.Composer.prototype.toScreen = function() {

	if( this.copyPass.isLoaded() ) {
		this.quad.material = this.copyPass.shader;
		this.quad.material.uniforms.tDiffuse.value = this.read;
		this.quad.material.uniforms.resolution.value.set( this.width, this.height );
		this.renderer.render( this.scene, this.camera );
	}

}

WAGNER.Composer.prototype.toTexture = function( t ) {

	if( this.copyPass.isLoaded() ) {
		this.quad.material = this.copyPass.shader;
		this.quad.material.uniforms.tDiffuse.value = this.read;
		this.renderer.render( this.scene, this.camera, t, true );
	}

}

WAGNER.Composer.prototype.pass = function( pass, uniforms ) {

	if( typeof pass === "string" ) {
		this.quad.material = this.passes[ pass ];
	}
	if( pass instanceof THREE.ShaderMaterial ) {
		this.quad.material = pass;
	}
	if( pass instanceof WAGNER.Pass ) {
		if( !pass.isLoaded() ) return;
		pass.run( this );
		return;
	}

	this.quad.material.uniforms.tDiffuse.value = this.read;
	for( var j in uniforms ) {
		this.quad.material.uniforms[ j ].value = uniforms[ j ];
	}
	this.quad.material.uniforms.resolution.value.set( this.width, this.height );
	this.quad.material.uniforms.time.value = .001 * ( Date.now() - this.startTime );
	this.renderer.render( this.scene, this.camera, this.write, false );
	this.swapBuffers();

}

WAGNER.Composer.prototype.reset = function() {

	this.read = this.front;
	this.write = this.back;

	this.output = this.write;
	this.input = this.read;

}

WAGNER.Composer.prototype.setSource = function( src ) {

	if( this.copyPass.isLoaded() ) {
		this.quad.material = this.copyPass.shader;
		this.quad.material.uniforms.tDiffuse.value = src;
		this.renderer.render( this.scene, this.camera, this.write, true );
		this.swapBuffers();
	}

}

WAGNER.Composer.prototype.setSize = function( w, h ) {

	this.width = w;
	this.height = h;

	this.camera.projectionMatrix.makeOrthographic( w / - 2, w / 2, h / 2, h / - 2, this.camera.near, this.camera.far );
	this.quad.scale.set( w, h, 1 );

	var rt = this.front.clone();
	rt.width = w;
	rt.height = h;
	if( this.quad.material instanceof WAGNER.Pass ) this.quad.material.uniforms.tDiffuse.value = rt;
	this.front = rt;

	var rt = this.back.clone();
	rt.width = w;
	rt.height = h;
	this.back = rt;

}

WAGNER.Composer.prototype.defaultMaterial = new THREE.MeshBasicMaterial();

WAGNER.loadShader = function( file, callback ) {

	var path;
	if( file.indexOf( '-vs.glsl' ) != -1 ) path = 'vertex-shaders/';
	else path = 'fragment-shaders/';

	var oReq = new XMLHttpRequest();
	oReq.onload = function() {
		var content = oReq.responseText;
		callback( content );
	}.bind( this );
	oReq.open( 'get', path + file, true );
	oReq.send();

}

WAGNER.processShader = function( vertexShaderCode, fragmentShaderCode ) {

	var regExp = /uniform\s+([^\s]+)\s+([^\s]+)\s*;/gi; 
	var regExp2 = /uniform\s+([^\s]+)\s+([^\s]+)\s*\[\s*(\w+)\s*\]*\s*;/gi;

	var typesMap = {
		
		sampler2D: { type: 't', value: function() { return new THREE.Texture() } },
		samplerCube: { type: 't', value: function() {} },

		bool: { type: 'b', value: function() { return 0; } },
		int: { type: 'i', value: function() { return 0; } },
		float: { type: 'f', value: function() { return 0; } },
		
		vec2: { type: 'v2', value: function() { return new THREE.Vector2() } },
		vec3: { type: 'v2', value: function() { return new THREE.Vector3() } },
		vec4: { type: 'v2', value: function() { return new THREE.Vector4() } },

		bvec2: { type: 'v2', value: function() { return new THREE.Vector2() } },
		bvec3: { type: 'v2', value: function() { return new THREE.Vector3() } },
		bvec4: { type: 'v2', value: function() { return new THREE.Vector4() } },

		ivec2: { type: 'v2', value: function() { return new THREE.Vector2() } },
		ivec3: { type: 'v2', value: function() { return new THREE.Vector3() } },
		ivec4: { type: 'v2', value: function() { return new THREE.Vector4() } },

		mat2: { type: 'v2', value: function() { return new THREE.Matrix2() } },
		mat3: { type: 'v2', value: function() { return new THREE.Matrix3() } },
		mat4: { type: 'v2', value: function() { return new THREE.Matrix4() } }

	}

	var arrayTypesMap = {
		vec3: { type: 'v3v', value: function() { return []; } }
	}

	var matches;
	var uniforms = {
		resolution: { type: 'v2', value: new THREE.Vector2( 1, 1 ) },
		time: { type: 'f', value: Date.now() },
		tDiffuse: { type: 't', value: new THREE.Texture() }
	};

	while( ( matches = regExp.exec( fragmentShaderCode ) ) != null) {
		if( matches.index === regExp.lastIndex) {
			regExp.lastIndex++;
		}
		var uniformType = matches[ 1 ],
			uniformName = matches[ 2 ];
		WAGNER.log( '  > SINGLE', uniformType, uniformName );
		uniforms[ uniformName ] = {
			type: typesMap[ uniformType ].type,
			value: typesMap[ uniformType ].value()
		};
	}

	while( ( matches = regExp2.exec( fragmentShaderCode ) ) != null) {
		if( matches.index === regExp.lastIndex) {
			regExp.lastIndex++;
		}
		var uniformType = matches[ 1 ],
			uniformName = matches[ 2 ],
			arraySize = matches[ 3 ];
		WAGNER.log( '  > ARRAY', arraySize, uniformType, uniformName );
		uniforms[ uniformName ] = {
			type: arrayTypesMap[ uniformType ].type,
			value: arrayTypesMap[ uniformType ].value()
		};
	}

	var shader = new THREE.ShaderMaterial( {
		uniforms: uniforms,
		vertexShader: vertexShaderCode,
		fragmentShader: fragmentShaderCode,
		shading: THREE.FlatShading,
		depthWrite: false,
		depthTest: false,
		transparent: true
	} );

	return shader;

}

WAGNER.Pass = function() {

	WAGNER.log( 'Pass constructor' );
	this.shader = null;
	this.loaded = null;

}

WAGNER.Pass.prototype.loadShader = function( id, c ) {

	var self = this;
	WAGNER.loadShader( 'orto-vs.glsl', function( vs ) {
		WAGNER.loadShader( id, function( fs ) {
			self.shader = WAGNER.processShader( vs, fs );
			if( c ) c.apply( self );
		} );
	} );

}

WAGNER.Pass.prototype.run = function( c ) {

	//WAGNER.log( 'Pass run' );
	c.pass( this.shader );

}

WAGNER.Pass.prototype.isLoaded = function() {
	
	if( this.loaded === null ) {
		if( this.shader instanceof THREE.ShaderMaterial ) {
			this.loaded = true;
		}
	} else {
		return this.loaded;
	}

}

WAGNER.Pass.prototype.getOfflineTexture = function( w, h, useRGBA ){

	var rtTexture = new THREE.WebGLRenderTarget( w, h, { 
		minFilter: THREE.LinearFilter, 
		magFilter: THREE.LinearFilter, 
		format: useRGBA?THREE.RGBAFormat:THREE.RGBFormat
	} );

	return rtTexture;

}

WAGNER.CopyPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'CopyPass constructor' );
	this.loadShader( 'copy-fs.glsl' );

}

WAGNER.CopyPass.prototype = new WAGNER.Pass();

WAGNER.BlendPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'BlendPass constructor' );
	this.loadShader( 'blend-fs.glsl', function() {
		this.shader.uniforms.mode.value = 1;
	} );
	
}

WAGNER.BlendPass.prototype = new WAGNER.Pass();

WAGNER.InvertPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'InvertPass constructor' );
	this.loadShader( 'invert-fs.glsl' );

}

WAGNER.InvertPass.prototype = new WAGNER.Pass();

WAGNER.SepiaPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'SepiaPass constructor' );
	this.loadShader( 'sepia-fs.glsl' );

}

WAGNER.SepiaPass.prototype = new WAGNER.Pass();

WAGNER.NoisePass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'Denoise Pass constructor' );
	this.loadShader( 'noise-fs.glsl', function() {
		this.shader.uniforms.amount.value = .01;
	} );

}

WAGNER.NoisePass.prototype = new WAGNER.Pass();

WAGNER.VignettePass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'Vignette Pass constructor' );
	this.loadShader( 'vignette-fs.glsl', function() {
		this.shader.uniforms.amount.value = 1;
		this.shader.uniforms.size.value = .1;
	} );

}

WAGNER.VignettePass.prototype = new WAGNER.Pass();

WAGNER.Vignette2Pass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'Vignette Pass constructor' );
	this.loadShader( 'vignette2-fs.glsl' );

}

WAGNER.Vignette2Pass.prototype = new WAGNER.Pass();

WAGNER.DenoisePass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'Denoise Pass constructor' );
	this.loadShader( 'denoise-fs.glsl', function() {
		this.shader.uniforms.exponent.value = 5;
		this.shader.uniforms.strength.value = 10;
	} );

}

WAGNER.DenoisePass.prototype = new WAGNER.Pass();

WAGNER.BoxBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'BoxBlurPass Pass constructor' );
	this.loadShader( 'box-blur-fs.glsl' );

}

WAGNER.BoxBlurPass.prototype = new WAGNER.Pass();

WAGNER.FullBoxBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'FullBoxBlurPass Pass constructor' );
	this.boxPass = new WAGNER.BoxBlurPass();

}

WAGNER.FullBoxBlurPass.prototype = new WAGNER.Pass();

WAGNER.FullBoxBlurPass.prototype.isLoaded = function() {

	if( this.boxPass.isLoaded() ) {
		this.loaded = true;
	}
	return WAGNER.Pass.prototype.isLoaded.call( this );

}

WAGNER.FullBoxBlurPass.prototype.run = function( c ) {

	var v = 20;
	this.boxPass.shader.uniforms.delta.value.set( v / c.width, 0 );
	c.pass( this.boxPass.shader );
	this.boxPass.shader.uniforms.delta.value.set( 0, v / c.height );
	c.pass( this.boxPass.shader );

}

WAGNER.ZoomBlurPass = function() {

	this.strength = 2;

	WAGNER.Pass.call( this );
	WAGNER.log( 'ZoomBlurPass Pass constructor' );
	this.loadShader( 'zoom-blur-fs.glsl', function() {
		this.shader.uniforms.center.value.set( .5, .5 );
		this.shader.uniforms.strength.value = this.strength;
	} );

}

WAGNER.ZoomBlurPass.prototype = new WAGNER.Pass();

WAGNER.ZoomBlurPass.prototype.run = function( c ) {

	this.shader.uniforms.strength.value = this.strength;
	c.pass( this.shader );

}

WAGNER.MultiPassBloomPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'MultiPassBloomPass Pass constructor' );

	this.composer = null;

	var s = .25;
	this.tmpTexture = this.getOfflineTexture( 512, 512 );//s * window.innerWidth, s * window.innerHeight );
	this.boxPass = new WAGNER.BoxBlurPass();
	this.blendPass = new WAGNER.BlendPass();
	this.zoomBlur = new WAGNER.ZoomBlurPass();

}

WAGNER.MultiPassBloomPass.prototype = new WAGNER.Pass();

WAGNER.MultiPassBloomPass.prototype.isLoaded = function() {

	if( this.boxPass.isLoaded() && 
		this.blendPass.isLoaded() &&
		this.zoomBlur.isLoaded() ) {
		this.loaded = true;
	}
	return WAGNER.Pass.prototype.isLoaded.call( this );

}

WAGNER.MultiPassBloomPass.prototype.run = function( c ) {

	if( !this.composer ) {
		this.composer = new WAGNER.Composer( c.renderer, { useRGBA: true } );
		this.composer.setSize( this.tmpTexture.width, this.tmpTexture.height );
	}

	var v = 20;

	this.composer.reset();
	this.composer.setSource( c.output );
	this.boxPass.shader.uniforms.delta.value.set( v / this.composer.width, 0 );
	this.composer.pass( this.boxPass.shader );
	this.boxPass.shader.uniforms.delta.value.set( 0, v / this.composer.height );
	this.composer.pass( this.boxPass.shader );

	this.composer.pass( this.zoomBlur );

	this.blendPass.shader.uniforms.mode.value = 9;
	this.blendPass.shader.uniforms.tDiffuse2.value = this.composer.output;
	c.pass( this.blendPass.shader );

}

WAGNER.CGAPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'CGA Pass constructor' );
	this.loadShader( 'cga-fs.glsl', function() {
		this.shader.uniforms.pixelDensity.value = window.devicePixelRatio;
	} );

}

WAGNER.CGAPass.prototype = new WAGNER.Pass();

WAGNER.SobelEdgeDetectionPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'SobelEdgeDetectionPass Pass constructor' );
	this.loadShader( 'sobel-fs.glsl' );

}

WAGNER.SobelEdgeDetectionPass.prototype = new WAGNER.Pass();

WAGNER.FreiChenEdgeDetectionPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'FreiChenEdgeDetectionPass Pass constructor' );
	this.loadShader( 'frei-chen-fs.glsl' );

}

WAGNER.FreiChenEdgeDetectionPass.prototype = new WAGNER.Pass();

WAGNER.DirtPass = function() {

	this.blendPass = new WAGNER.BlendPass();
	this.dirtTexture = THREE.ImageUtils.loadTexture( 'assets/textures/dirt8.jpg' );

}

WAGNER.DirtPass.prototype = new WAGNER.Pass();

WAGNER.DirtPass.prototype.isLoaded = function() {

	if( this.blendPass.isLoaded() ) {
		this.loaded = true;
	}
	return WAGNER.Pass.prototype.isLoaded.call( this );

}

WAGNER.DirtPass.prototype.run = function( c ) {

	this.blendPass.shader.uniforms.mode.value = 14;
	this.blendPass.shader.uniforms.tDiffuse2.value = this.dirtTexture;
	c.pass( this.blendPass.shader );

}

WAGNER.GuidedBoxBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'GuidedBoxBlurPass Pass constructor' );
	this.loadShader( 'guided-box-blur-fs.glsl' );

}

WAGNER.GuidedBoxBlurPass.prototype = new WAGNER.Pass();

WAGNER.GuidedFullBoxBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'FullBoxBlurPass Pass constructor' );
	this.guidedBoxPass = new WAGNER.GuidedBoxBlurPass();

}

WAGNER.GuidedFullBoxBlurPass.prototype = new WAGNER.Pass();

WAGNER.GuidedFullBoxBlurPass.prototype.isLoaded = function() {

	if( this.guidedBoxPass.isLoaded() ) {
		this.loaded = true;
	}
	return WAGNER.Pass.prototype.isLoaded.call( this );

}

WAGNER.GuidedFullBoxBlurPass.prototype.run = function( c ) {

	var v = 20;
	this.guidedBoxPass.shader.uniforms.invertBiasMap.value = 0;
	this.guidedBoxPass.shader.uniforms.delta.value.set( v / c.width, 0 );
	c.pass( this.guidedBoxPass.shader );
	this.guidedBoxPass.shader.uniforms.delta.value.set( 0, v / c.height );
	c.pass( this.guidedBoxPass.shader );

}

WAGNER.PixelatePass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'PixelatePass Pass constructor' );
	this.loadShader( 'pixelate-fs.glsl', function() {
		this.shader.uniforms.amount.value = 320;
	} );

}

WAGNER.PixelatePass.prototype = new WAGNER.Pass();

WAGNER.RGBSplitPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'RGBSplitPass Pass constructor' );
	this.loadShader( 'rgb-split-fs.glsl', function() {
		this.shader.uniforms.distance.value.set( 10, 10 );
	} );

}

WAGNER.RGBSplitPass.prototype = new WAGNER.Pass();

WAGNER.ArtPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'ArtPass Pass constructor' );
	this.loadShader( 'art-fs.glsl' );

}

WAGNER.ArtPass.prototype = new WAGNER.Pass();

/*

https://www.shadertoy.com/view/XssGz8

Simulates Chromatic Aberration by linearly interpolating blur-weights from red to green to blue.
Original idea by Kusma: https://github.com/kusma/vlee/blob/master/data/postprocess.fx
Barrel Blur forked from https://www.shadertoy.com/view/XslGz8

*/

WAGNER.ChromaticAberrationPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'ChromaticAberrationPass Pass constructor' );
	this.loadShader( 'chromatic-aberration-fs.glsl' );

}

WAGNER.ChromaticAberrationPass.prototype = new WAGNER.Pass();

WAGNER.BarrelBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'BarrelBlurPass Pass constructor' );
	this.loadShader( 'barrel-blur-fs.glsl' );

}

WAGNER.BarrelBlurPass.prototype = new WAGNER.Pass();

WAGNER.OldVideoPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'OldVideoPass Pass constructor' );
	this.loadShader( 'old-video-fs.glsl' );

}

WAGNER.OldVideoPass.prototype = new WAGNER.Pass();

WAGNER.DotScreenPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'DotScreenPass Pass constructor' );
	this.loadShader( 'dot-screen-fs.glsl' );

}

WAGNER.DotScreenPass.prototype = new WAGNER.Pass();

WAGNER.PoissonDiscBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'PoissonDiscBlurPass Pass constructor' );
	this.loadShader( 'poisson-disc-blur-fs.glsl' );

}

WAGNER.PoissonDiscBlurPass.prototype = new WAGNER.Pass();

WAGNER.CircularBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'CircularBlurPass Pass constructor' );
	this.loadShader( 'circular-blur-fs.glsl' );

}

WAGNER.CircularBlurPass.prototype = new WAGNER.Pass();
