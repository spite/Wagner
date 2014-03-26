(function() {

'use strict';

var WAGNER = WAGNER || {};

WAGNER.vertexShadersPath = './vertex-shaders';
WAGNER.fragmentShadersPath = './fragment-shaders';
WAGNER.assetsPath = './assets';

WAGNER.log = function( msg ) {
	console.log( msg );
};

WAGNER.Composer = function( renderer, settings ) {

	this.width = 1;
	this.height = 1;

	this.settings = settings || {};
	this.useRGBA = this.settings.useRGBA || false;

	this.renderer = renderer;
	this.copyPass = new WAGNER.CopyPass( this.settings );

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

};

WAGNER.Composer.prototype.linkPass = function( id, pass ) {

	function WagnerLoadPassException( message ) {
		this.message = 'Pass "' + id + '" already loaded.';
		this.name = "WagnerLoadPassException";
		this.toString = function() {
			return this.message;
		};
	}
	
	if( this.passes[ id ] ) {
		throw new WagnerLoadPassException( id, pass );
	}

	this.passes[ id ] = pass;

};

WAGNER.Composer.prototype.swapBuffers = function() {

	this.output = this.write;
	this.input = this.read;

	var t = this.write;
	this.write = this.read;
	this.read = t;

};

WAGNER.Composer.prototype.render = function( scene, camera, keep ) {

	if( this.copyPass.isLoaded() ) {
		if( keep ) this.swapBuffers();
		this.renderer.render( scene, camera, this.write, true );
		this.swapBuffers();
	}

};

WAGNER.Composer.prototype.toScreen = function() {

	if( this.copyPass.isLoaded() ) {
		this.quad.material = this.copyPass.shader;
		this.quad.material.uniforms.tDiffuse.value = this.read;
		this.quad.material.uniforms.resolution.value.set( this.width, this.height );
		this.renderer.render( this.scene, this.camera );
	}

};

WAGNER.Composer.prototype.toTexture = function( t ) {

	if( this.copyPass.isLoaded() ) {
		this.quad.material = this.copyPass.shader;
		this.quad.material.uniforms.tDiffuse.value = this.read;
		this.renderer.render( this.scene, this.camera, t, true );
	}

};

WAGNER.Composer.prototype.pass = function( pass, uniforms ) {

	if( typeof pass === 'string' ) {
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
	this.quad.material.uniforms.time.value = 0.001 * ( Date.now() - this.startTime );
	this.renderer.render( this.scene, this.camera, this.write, false );
	this.swapBuffers();

};

WAGNER.Composer.prototype.reset = function() {

	this.read = this.front;
	this.write = this.back;

	this.output = this.write;
	this.input = this.read;

};

WAGNER.Composer.prototype.setSource = function( src ) {

	if( this.copyPass.isLoaded() ) {
		this.quad.material = this.copyPass.shader;
		this.quad.material.uniforms.tDiffuse.value = src;
		this.renderer.render( this.scene, this.camera, this.write, true );
		this.swapBuffers();
	}

};

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

	rt = this.back.clone();
	rt.width = w;
	rt.height = h;
	this.back = rt;

};

WAGNER.Composer.prototype.defaultMaterial = new THREE.MeshBasicMaterial();

WAGNER.loadShader = function( file, callback ) {

	var oReq = new XMLHttpRequest();
	oReq.onload = function() {
		var content = oReq.responseText;
		callback( content );
	}.bind( this );
	oReq.onerror = function() {

		function WagnerLoadShaderException( f ) {
			this.message = 'Shader "' + f + '" couldn\'t be loaded.';
			this.name = "WagnerLoadShaderException";
			this.toString = function() {
				return this.message;
			};
		}
		throw new WagnerLoadShaderException( file );
	};
	oReq.onabort = function() {

		function WagnerLoadShaderException( f ) {
			this.message = 'Shader "' + f + '" load was aborted.';
			this.name = "WagnerLoadShaderException";
			this.toString = function() {
				return this.message;
			};
		}
		throw new WagnerLoadShaderException( file );
	};
	oReq.open( 'get', file, true );
	oReq.send();

};

WAGNER.processShader = function( vertexShaderCode, fragmentShaderCode ) {

	var regExp = /uniform\s+([^\s]+)\s+([^\s]+)\s*;/gi; 
	var regExp2 = /uniform\s+([^\s]+)\s+([^\s]+)\s*\[\s*(\w+)\s*\]*\s*;/gi;

	var typesMap = {
		
		sampler2D: { type: 't', value: function() { return new THREE.Texture(); } },
		samplerCube: { type: 't', value: function() {} },

		bool:  { type: 'b', value: function() { return 0; } },
		int:   { type: 'i', value: function() { return 0; } },
		float: { type: 'f', value: function() { return 0; } },
		
		vec2: { type: 'v2', value: function() { return new THREE.Vector2(); } },
		vec3: { type: 'v3', value: function() { return new THREE.Vector3(); } },
		vec4: { type: 'v4', value: function() { return new THREE.Vector4(); } },

		bvec2: { type: 'v2', value: function() { return new THREE.Vector2(); } },
		bvec3: { type: 'v3', value: function() { return new THREE.Vector3(); } },
		bvec4: { type: 'v4', value: function() { return new THREE.Vector4(); } },

		ivec2: { type: 'v2', value: function() { return new THREE.Vector2(); } },
		ivec3: { type: 'v3', value: function() { return new THREE.Vector3(); } },
		ivec4: { type: 'v4', value: function() { return new THREE.Vector4(); } },

		mat2: { type: 'v2', value: function() { return new THREE.Matrix2(); } },
		mat3: { type: 'v3', value: function() { return new THREE.Matrix3(); } },
		mat4: { type: 'v4', value: function() { return new THREE.Matrix4(); } }

	};

	var arrayTypesMap = {
		float: { type: 'fv', value: function() { return []; } },
		vec3: { type: 'v3v', value: function() { return []; } }
	};

	var matches;
	var uniforms = {
		resolution: { type: 'v2', value: new THREE.Vector2( 1, 1 ), default: true },
		time: { type: 'f', value: Date.now(), default: true },
		tDiffuse: { type: 't', value: new THREE.Texture(), default: true }
	};

  var uniformType, uniformName, arraySize;
  
	while( ( matches = regExp.exec( fragmentShaderCode ) ) !== null) {
		if( matches.index === regExp.lastIndex) {
			regExp.lastIndex++;
		}
		uniformType = matches[ 1 ];
		uniformName = matches[ 2 ];
		WAGNER.log( '  > SINGLE', uniformType, uniformName );
		uniforms[ uniformName ] = {
			type: typesMap[ uniformType ].type,
			value: typesMap[ uniformType ].value()
		};
	}

	while( ( matches = regExp2.exec( fragmentShaderCode ) ) !== null) {
		if( matches.index === regExp.lastIndex) {
			regExp.lastIndex++;
		}
		uniformType = matches[ 1 ];
		uniformName = matches[ 2 ];
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

};

WAGNER.Pass = function() {

	WAGNER.log( 'Pass constructor' );
	this.shader = null;
	this.loaded = null;
	this.params = {};

};

WAGNER.Pass.prototype.loadShader = function( id, c ) {

	var self = this;
	WAGNER.loadShader( WAGNER.vertexShadersPath + '/orto-vs.glsl', function( vs ) {
		WAGNER.loadShader( WAGNER.fragmentShadersPath + '/' + id, function( fs ) {
			self.shader = WAGNER.processShader( vs, fs );
			//self.mapUniforms( self.shader.uniforms );
			if( c ) c.apply( self );
		} );
	} );

};

WAGNER.Pass.prototype.mapUniforms = function( uniforms ) {

	var params = this.params;

	for( var j in uniforms ) {
		if( !uniforms[ j ].default ) {
			(function( id ) {
				Object.defineProperty( params, id, { 
					get : function(){ return uniforms[ id ].value; }, 
					set : function( v ){ uniforms[ id ].value = v; },
					configurable : false 
				} );
			})( j );
		}
	}

};

WAGNER.Pass.prototype.run = function( c ) {

	//WAGNER.log( 'Pass run' );
	c.pass( this.shader );

};

WAGNER.Pass.prototype.isLoaded = function() {
	
	if( this.loaded === null ) {
		if( this.shader instanceof THREE.ShaderMaterial ) {
			this.loaded = true;
		}
	} else {
		return this.loaded;
	}

};

WAGNER.Pass.prototype.getOfflineTexture = function( w, h, useRGBA ){

	var rtTexture = new THREE.WebGLRenderTarget( w, h, { 
		minFilter: THREE.LinearFilter, 
		magFilter: THREE.LinearFilter, 
		format: useRGBA?THREE.RGBAFormat:THREE.RGBFormat
	} );

	return rtTexture;

};

WAGNER.CopyPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'CopyPass constructor' );
	this.loadShader( 'copy-fs.glsl' );

};

WAGNER.CopyPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.BlendPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'BlendPass constructor' );
	this.loadShader( 'blend-fs.glsl', function() {
		this.shader.uniforms.mode.value = 1;
		this.shader.uniforms.opacity.value = 1;
	} );
	
};

WAGNER.BlendMode = {
	Normal: 1,
	Dissolve: 2,
	Darken: 3,
	Multiply: 4,
	ColorBurn: 5,
	LinearBurn: 6,
	DarkerColor: 7,
	Lighten: 8,
	Screen: 9,
	ColorDodge: 10,
	LinearDodge: 11,
	LighterColor: 12,
	Overlay: 13,
	SoftLight: 14,
	HardLight: 15,
	VividLight: 16,
	LinearLight: 17,
	PinLight: 18,
	HardMix: 19,
	Difference: 20,
	Exclusion: 21,
	Substract: 22,
	Divide: 23
};

WAGNER.BlendPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.InvertPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'InvertPass constructor' );
	this.loadShader( 'invert-fs.glsl' );

};

WAGNER.InvertPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.SepiaPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'SepiaPass constructor' );
	this.loadShader( 'sepia-fs.glsl' );

};

WAGNER.SepiaPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.Pass.prototype.bindUniform = function( p, s, v, c ) {

	Object.defineProperty( p, v, { 
		get : function(){ return s.uniforms[ id ].value; }, 
		set : c,
		configurable : false 
	} );

};

WAGNER.NoisePass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'Noise Pass constructor' );
	this.loadShader( 'noise-fs.glsl' );

	this.params.noiseAmount = 0.1;

};

WAGNER.NoisePass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.NoisePass.prototype.run = function( c ) {

	this.shader.uniforms.amount.value = this.params.noiseAmount;
	c.pass( this.shader );

};

WAGNER.VignettePass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'Vignette Pass constructor' );
	this.loadShader( 'vignette-fs.glsl' );

	this.params.amount = 1;
	this.params.size = 0.1;

};

WAGNER.VignettePass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.VignettePass.prototype.run = function( c ) {

	this.shader.uniforms.amount.value = this.params.amount;
	this.shader.uniforms.size.value = this.params.size;
	c.pass( this.shader );

};

WAGNER.Vignette2Pass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'Vignette Pass constructor' );
	this.loadShader( 'vignette2-fs.glsl' );

	this.params.boost = 2;
	this.params.reduction = 2;

};

WAGNER.Vignette2Pass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.Vignette2Pass.prototype.run = function( c ) {

	this.shader.uniforms.boost.value = this.params.boost;
	this.shader.uniforms.reduction.value = this.params.reduction;
	c.pass( this.shader );

};

WAGNER.DenoisePass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'Denoise Pass constructor' );
	this.loadShader( 'denoise-fs.glsl' );

	this.params.exponent = 5;
	this.params.strength = 10;

};

WAGNER.DenoisePass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.DenoisePass.prototype.run = function( c ) {

	this.shader.uniforms.exponent.value = this.params.exponent;
	this.shader.uniforms.strength.value = this.params.strength;
	c.pass( this.shader );

};

WAGNER.BoxBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'BoxBlurPass Pass constructor' );
	this.loadShader( 'box-blur-fs.glsl' );

};

WAGNER.BoxBlurPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.FullBoxBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'FullBoxBlurPass Pass constructor' );
	this.boxPass = new WAGNER.BoxBlurPass();
	this.params.amount = 20;

};

WAGNER.FullBoxBlurPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.FullBoxBlurPass.prototype.isLoaded = function() {

	if( this.boxPass.isLoaded() ) {
		this.loaded = true;
	}
	return WAGNER.Pass.prototype.isLoaded.call( this );

};

WAGNER.FullBoxBlurPass.prototype.run = function( c ) {

	this.boxPass.shader.uniforms.delta.value.set( this.params.amount / c.width, 0 );
	c.pass( this.boxPass.shader );
	this.boxPass.shader.uniforms.delta.value.set( 0, this.params.amount / c.height );
	c.pass( this.boxPass.shader );

};

WAGNER.ZoomBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'ZoomBlurPass Pass constructor' );
	this.loadShader( 'zoom-blur-fs.glsl' );

	this.params.center = new THREE.Vector2( 0.5, 0.5 );
	this.params.strength = 2;

};

WAGNER.ZoomBlurPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.ZoomBlurPass.prototype.run = function( c ) {

	this.shader.uniforms.center.value.copy ( this.params.center );
	this.shader.uniforms.strength.value = this.params.strength;
	c.pass( this.shader );

};

WAGNER.MultiPassBloomPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'MultiPassBloomPass Pass constructor' );

	this.composer = null;

	var s = 0.25;
	this.tmpTexture  = this.getOfflineTexture( 512, 512 );//s * window.innerWidth, s * window.innerHeight );
	this.blurPass    = new WAGNER.FullBoxBlurPass();
	this.blendPass   = new WAGNER.BlendPass();
	this.zoomBlur    = new WAGNER.ZoomBlurPass();

	this.params.blurAmount = 20;
	this.params.applyZoomBlur = false;
	this.params.zoomBlurStrength = 2;
	this.params.useTexture = false;

};

WAGNER.MultiPassBloomPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.MultiPassBloomPass.prototype.isLoaded = function() {

	if( this.blurPass.isLoaded() && 
		this.blendPass.isLoaded() &&
		this.zoomBlur.isLoaded() ) {
		this.loaded = true;
	}
	return WAGNER.Pass.prototype.isLoaded.call( this );

};

WAGNER.MultiPassBloomPass.prototype.run = function( c ) {

	if( !this.composer ) {
		this.composer = new WAGNER.Composer( c.renderer, { useRGBA: true } );
		this.composer.setSize( this.tmpTexture.width, this.tmpTexture.height );
	}

	this.composer.reset();

	if( this.params.useTexture === true ) {
		this.composer.setSource( this.params.glowTexture );
	} else {
		this.composer.setSource( c.output );
	}

	this.composer.setSource( c.output );
	this.blurPass.params.amount = this.params.blurAmount;
	this.composer.pass( this.blurPass );
	
	if( this.params.applyZoomBlur ) {
		this.zoomBlur.params.strength = this.params.zoomBlurStrength;
		this.composer.pass( this.zoomBlur );
	}

	if( this.params.useTexture === true ) {
		this.blendPass.shader.uniforms.mode.value = WAGNER.BlendMode.Screen;
		this.blendPass.shader.uniforms.tDiffuse2.value = this.params.glowTexture;
		c.pass( this.blendPass.shader );
	}

	this.blendPass.shader.uniforms.mode.value = WAGNER.BlendMode.Screen;
	this.blendPass.shader.uniforms.tDiffuse2.value = this.composer.output;
	c.pass( this.blendPass.shader );

};

WAGNER.CGAPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'CGA Pass constructor' );
	this.loadShader( 'cga-fs.glsl', function() {
		this.shader.uniforms.pixelDensity.value = window.devicePixelRatio;
	} );

};

WAGNER.CGAPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.SobelEdgeDetectionPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'SobelEdgeDetectionPass Pass constructor' );
	this.loadShader( 'sobel-fs.glsl' );

};

WAGNER.SobelEdgeDetectionPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.FreiChenEdgeDetectionPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'FreiChenEdgeDetectionPass Pass constructor' );
	this.loadShader( 'frei-chen-fs.glsl' );

};

WAGNER.FreiChenEdgeDetectionPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.DirtPass = function() {

	this.blendPass = new WAGNER.BlendPass();
	this.dirtTexture = THREE.ImageUtils.loadTexture( 'assets/textures/dirt8.jpg' );

};

WAGNER.DirtPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.DirtPass.prototype.isLoaded = function() {

	if( this.blendPass.isLoaded() ) {
		this.loaded = true;
	}
	return WAGNER.Pass.prototype.isLoaded.call( this );

};

WAGNER.DirtPass.prototype.run = function( c ) {

	this.blendPass.shader.uniforms.sizeMode.value = 1;
	this.blendPass.shader.uniforms.mode.value = WAGNER.BlendMode.SoftLight;
	this.blendPass.shader.uniforms.tDiffuse2.value = this.dirtTexture;
	this.blendPass.shader.uniforms.resolution2.value.set( this.dirtTexture.image.width, this.dirtTexture.image.height );
	this.blendPass.shader.uniforms.aspectRatio.value = c.read.width / c.read.height;
	this.blendPass.shader.uniforms.aspectRatio2.value = this.dirtTexture.image.width / this.dirtTexture.image.height;
	c.pass( this.blendPass.shader );

};

WAGNER.GuidedBoxBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'GuidedBoxBlurPass Pass constructor' );
	this.loadShader( 'guided-box-blur-fs.glsl' );

};

WAGNER.GuidedBoxBlurPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.GuidedFullBoxBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'FullBoxBlurPass Pass constructor' );
	this.guidedBoxPass = new WAGNER.GuidedBoxBlurPass();

};

WAGNER.GuidedFullBoxBlurPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.GuidedFullBoxBlurPass.prototype.isLoaded = function() {

	if( this.guidedBoxPass.isLoaded() ) {
		this.loaded = true;
	}
	return WAGNER.Pass.prototype.isLoaded.call( this );

};

WAGNER.GuidedFullBoxBlurPass.prototype.run = function( c ) {

	var v = 10;
	this.guidedBoxPass.shader.uniforms.invertBiasMap.value = 0;
	this.guidedBoxPass.shader.uniforms.delta.value.set( v / c.width, 0 );
	c.pass( this.guidedBoxPass.shader );
	this.guidedBoxPass.shader.uniforms.delta.value.set( 0, v / c.height );
	c.pass( this.guidedBoxPass.shader );

};

WAGNER.PixelatePass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'PixelatePass Pass constructor' );
	this.loadShader( 'pixelate-fs.glsl', function() {
		this.shader.uniforms.amount.value = 320;
	} );

};

WAGNER.PixelatePass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.RGBSplitPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'RGBSplitPass Pass constructor' );
	this.loadShader( 'rgb-split-fs.glsl', function() {
		this.shader.uniforms.distance.value.set( 10, 10 );
	} );

};

WAGNER.RGBSplitPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.ArtPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'ArtPass Pass constructor' );
	this.loadShader( 'art-fs.glsl' );

};

WAGNER.ArtPass.prototype = Object.create( WAGNER.Pass.prototype );

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

};

WAGNER.ChromaticAberrationPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.BarrelBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'BarrelBlurPass Pass constructor' );
	this.loadShader( 'barrel-blur-fs.glsl' );

};

WAGNER.BarrelBlurPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.OldVideoPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'OldVideoPass Pass constructor' );
	this.loadShader( 'old-video-fs.glsl' );

};

WAGNER.OldVideoPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.DotScreenPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'DotScreenPass Pass constructor' );
	this.loadShader( 'dot-screen-fs.glsl' );

};

WAGNER.DotScreenPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.PoissonDiscBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'PoissonDiscBlurPass Pass constructor' );
	this.loadShader( 'poisson-disc-blur-fs.glsl' );

};

WAGNER.PoissonDiscBlurPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.CircularBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'CircularBlurPass Pass constructor' );
	this.loadShader( 'circular-blur-fs.glsl' );

};

WAGNER.CircularBlurPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.ToonPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'ToonPass Pass constructor' );
	this.loadShader( 'toon-fs.glsl' );

};

WAGNER.ToonPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.FXAAPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'FXAA Pass constructor' );
	this.loadShader( 'fxaa-fs.glsl' );

};

WAGNER.FXAAPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.HighPassPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'HighPass Pass constructor' );
	this.loadShader( 'high-pass-fs.glsl' );

};

WAGNER.HighPassPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.GrayscalePass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'GrayscalePass Pass constructor' );
	this.loadShader( 'grayscale-fs.glsl' );

};

WAGNER.GrayscalePass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.ASCIIPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'ASCIIPass Pass constructor' );
	this.loadShader( 'ascii-fs.glsl', function() {
		this.shader.uniforms.tAscii.value = THREE.ImageUtils.loadTexture( WAGNER.assetsPath + '/ascii/8x16_ascii_font_sorted.gif' );
	} );

};

WAGNER.ASCIIPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.LEDPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'LEDPass Pass constructor' );
	this.loadShader( 'led-fs.glsl', function() {
		this.shader.uniforms.offset_red.value.set( 0, 0 );
		this.shader.uniforms.offset_green.value.set( 0, 0 );
		this.shader.uniforms.offset_blue.value.set( 0, 0 );
		this.shader.uniforms.dotdistance.value = 5;
	} );

};

WAGNER.LEDPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.HalftonePass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'HalftonePass Pass constructor' );
	this.loadShader( 'halftone-fs.glsl', function() {
		this.shader.uniforms.pixelSize.value = 6;
	} );

};

WAGNER.HalftonePass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.HalftoneCMYKPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'HalftoneCMYKPass Pass constructor' );
	this.loadShader( 'halftone-cmyk-fs.glsl', function() {

	} );

};

WAGNER.HalftoneCMYKPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.CrossFadePass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'CrossFadePass Pass constructor' );
	this.loadShader( 'crossfade-fs.glsl' );

	this.params.tDiffuse2 = null;
	this.params.tFadeMap = null;
	this.params.threshold = 0;

};

WAGNER.CrossFadePass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.CrossFadePass.prototype.run = function( c ) {

	this.shader.uniforms.tDiffuse2.value = this.params.tDiffuse2;
	this.shader.uniforms.tFadeMap.value = this.params.tFadeMap;
	this.shader.uniforms.threshold.value = this.params.amount;

	c.pass( this.shader );

}

window.WAGNER = WAGNER;
})();