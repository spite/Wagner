(function() {
	'use strict';

	var WAGNER = this.WAGNER || {};

	WAGNER.assetsPath = './assets';

	WAGNER.log = function() {
		// console.log( Array.prototype.slice.call( arguments ).join( ' ' ) );
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
		new THREE.PlaneBufferGeometry( 1, 1 ),
		this.defaultMaterial
	);
	this.scene.add( this.quad );
	this.camera = new THREE.OrthographicCamera( 1, 1, 1, 1, -10000, 10000 );

	this.front = new THREE.WebGLRenderTarget(1, 1, {
		minFilter: this.settings.minFilter !== undefined ? this.settings.minFilter : THREE.LinearFilter,
		magFilter: this.settings.magFilter !== undefined ? this.settings.magFilter : THREE.LinearFilter,
		wrapS: this.settings.wrapS !== undefined ? this.settings.wrapS : THREE.ClampToEdgeWrapping,
		wrapT: this.settings.wrapT !== undefined ? this.settings.wrapT : THREE.ClampToEdgeWrapping,
		format: this.useRGBA ? THREE.RGBAFormat : THREE.RGBFormat,
		type: this.settings.type !== undefined ? this.settings.type : THREE.UnsignedByteType,
		stencilBuffer: this.settings.stencilBuffer !== undefined ? this.settings.stencilBuffer : true
	});

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

WAGNER.Composer.prototype.render = function( scene, camera, keep, output ) {

	if( this.copyPass.isLoaded() ) {
		if( keep ) this.swapBuffers();
		this.renderer.render( scene, camera, output?output:this.write, true );
		if( !output ) this.swapBuffers();
	}

};

WAGNER.Composer.prototype.toScreen = function() {

	if( this.copyPass.isLoaded() ) {
		this.quad.material = this.copyPass.shader;
		this.quad.material.uniforms.tInput.value = this.read;
		this.quad.material.uniforms.resolution.value.set( this.width, this.height );
		this.renderer.render( this.scene, this.camera );
	}

};

WAGNER.Composer.prototype.toTexture = function( t ) {

	if( this.copyPass.isLoaded() ) {
		this.quad.material = this.copyPass.shader;
		this.quad.material.uniforms.tInput.value = this.read;
		this.renderer.render( this.scene, this.camera, t, false );
	}

};

WAGNER.Composer.prototype.pass = function( pass ) {

	if( pass instanceof WAGNER.Stack ) {

		this.passStack(pass);

	} else {

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

		if( !pass.isSim ) this.quad.material.uniforms.tInput.value = this.read;

		this.quad.material.uniforms.resolution.value.set( this.width, this.height );
		this.quad.material.uniforms.time.value = 0.001 * ( Date.now() - this.startTime );
		this.renderer.render( this.scene, this.camera, this.write, false );
		this.swapBuffers();

	}

};

WAGNER.Composer.prototype.passStack = function( stack ) {

	stack.getPasses().forEach( function ( pass ) {

		this.pass( pass );

	}.bind(this));

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
		this.quad.material.uniforms.tInput.value = src;
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
	if( this.quad.material instanceof WAGNER.Pass ) this.quad.material.uniforms.tInput.value = rt;
	this.front = rt;

	rt = this.back.clone();
	rt.width = w;
	rt.height = h;
	this.back = rt;

};

WAGNER.Composer.prototype.defaultMaterial = new THREE.MeshBasicMaterial();


WAGNER.processShader = function( vertexShaderCode, fragmentShaderCode ) {

	WAGNER.log( 'Processing Shader | Performing uniform Reflection...' );

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
		tInput: { type: 't', value: new THREE.Texture(), default: true }
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

	WAGNER.log( 'Uniform reflection completed. Compiling...' );

	var shader = new THREE.ShaderMaterial( {
		uniforms: uniforms,
		vertexShader: vertexShaderCode,
		fragmentShader: fragmentShaderCode,
		shading: THREE.FlatShading,
		depthWrite: false,
		depthTest: false,
		transparent: true
	} );

	WAGNER.log( 'Compiled' );

	return shader;

};

WAGNER.Pass = function() {

	WAGNER.log( 'Pass constructor' );
	this.shader = null;
	this.loaded = null;
	this.params = {};
	this.isSim = false;

};

WAGNER.Pass.prototype.loadShader = function( id, c ) {

	var self = this;
	var vs = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }';
	WAGNER.loadShader( id, function( fs ) {
		self.shader = WAGNER.processShader( vs, fs );
		//self.mapUniforms( self.shader.uniforms );
		if( c ) c.apply( self );
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

// WAGNER.Pass.prototype.bindUniform = function( p, s, v, c ) {

// 	Object.defineProperty( p, v, {
// 		get : function(){ return s.uniforms[ id ].value; },
// 		set : c,
// 		configurable : false
// 	} );

// };


WAGNER.ShadersPool = function () {

	this.availableShaders = [];

};

WAGNER.ShadersPool.prototype.getPasses = function ( passItems ) {

	var pass,
		passes = [];

	this.availableShaders.forEach( function ( availableShader ) {

		availableShader.used = false;

	} );

	if ( passItems ) {

		passItems.forEach( function ( passItem, index ) {

			if ( passItem.enabled ) {

				pass = this.getShaderFromPool( passItem.shaderName );

				if ( passItem.params ) {

					pass.params = this.extendParams(pass.params, passItem.params)

				}

				passes.push( pass );

			}

		}.bind( this ) );

	}

	return passes;

};

WAGNER.ShadersPool.prototype.getShaderFromPool = function ( shaderName ) {

	var pass,
		shaderItem;

	if ( shaderName && WAGNER[ shaderName ] ) {

		for (var i = this.availableShaders.length - 1; i >= 0; i--) {

			shaderItem = this.availableShaders[i];

			if ( !shaderItem.used && shaderItem.name === shaderName ) {

				shaderItem.used = true;
				pass = shaderItem.pass;
				break;

			}
			
		};

		if ( !pass ) {

			pass = new WAGNER[ shaderName ]();

			shaderItem = {
				pass: pass,
				name: shaderName,
				used: true
			};

			this.availableShaders.push( shaderItem );

		}

		return pass;

	}

};

WAGNER.ShadersPool.prototype.extendParams = function(target, source) {

	var obj = {},
		i = 0,
		il = arguments.length,
		key;

	for (; i < il; i++) {

		for (key in arguments[i]) {

			if (arguments[i].hasOwnProperty(key)) {

				obj[key] = arguments[i][key];

			}
		}
	}

	return obj;
	
};


WAGNER.Stack = function ( shadersPool ) {

	this.passItems = [];
	this.shadersPool = shadersPool;
	this.passes = [];

};

WAGNER.Stack.prototype.addPass = function ( shaderName, enabled, params, index ) {

	var length,
		passItem = {
			shaderName: shaderName,
			enabled: enabled || false
		};

	//todo: use and store params values

	this.passItems.push( passItem );
	length = this.passItems.length;
	
	this.updatePasses();

	if ( index ) {

		return this.movePassToIndex( this.passItems[ length ], index );

	} else {

		return length - 1;

	}

};

WAGNER.Stack.prototype.removePass = function ( index ) {

	this.passItems.splice(index, 1);
	this.updatePasses();

};

WAGNER.Stack.prototype.enablePass = function ( index ) {

	this.passItems[ index ].enabled = true;
	this.updatePasses();

};

WAGNER.Stack.prototype.disablePass = function ( index ) {

	this.passItems[ index ].enabled = false;
	this.updatePasses();

};

WAGNER.Stack.prototype.isPassEnabled = function ( index ) {

	return this.passItems[ index ].enabled;

};

WAGNER.Stack.prototype.movePassToIndex = function ( index, destIndex ) {

	this.passItems.splice( destIndex, 0, this.passItems.splice( index, 1 )[ 0 ] );
	this.updatePasses();
	return destIndex; //TODO: check if destIndex is final index

};

WAGNER.Stack.prototype.reverse = function () {

	this.passItems.reverse();
	this.updatePasses();

};

WAGNER.Stack.prototype.updatePasses = function () {

	this.passes = this.shadersPool.getPasses( this.passItems );

	// init default params for new passItems
	this.passItems.forEach( function ( passItem, index ) {

		if (passItem.params === undefined) {

			passItem.params = JSON.parse(JSON.stringify(this.passes[index].params)); // clone params without reference to the real shader instance params
			// console.log('updatePasses', passItem, passItem.params);

		}

	}.bind(this) );

	// console.log('Updated stack passes list from shaders pool. Stack contains', this.passes.length, 'shaders, and there are', this.shadersPool.availableShaders.length, 'shaders in the pool.');

};

WAGNER.Stack.prototype.getPasses = function () {

	return this.passes;

};


WAGNER.ASCIIPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'ASCIIPass Pass constructor' );
	this.loadShader( 'ascii-fs', function() {
		this.shader.uniforms.tAscii.value = THREE.ImageUtils.loadTexture( WAGNER.assetsPath + '/ascii/8x16_ascii_font_sorted.gif' );
	} );

};

WAGNER.ASCIIPass.prototype = Object.create( WAGNER.Pass.prototype );


WAGNER.BarrelBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'BarrelBlurPass Pass constructor' );
	this.loadShader( 'barrel-blur-fs' );

};

WAGNER.BarrelBlurPass.prototype = Object.create( WAGNER.Pass.prototype );


WAGNER.BleachPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'Bleach Pass constructor' );
	this.loadShader( 'bleach-fs', function( fs ) {

	} );

	this.params.amount = 1;

}

WAGNER.BleachPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.BleachPass.prototype.run = function( c ) {

	this.shader.uniforms.amount.value = this.params.amount;

	c.pass( this.shader );

};


WAGNER.BlendPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'BlendPass constructor' );
	this.loadShader( 'blend-fs' );

	this.params.mode = 1;
	this.params.opacity = 1;
	this.params.tInput2 = null;
	this.params.resolution2 = new THREE.Vector2();
	this.params.sizeMode = 1;
	this.params.aspectRatio = 1;
	this.params.aspectRatio2 = 1;

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

WAGNER.BlendPass.prototype.run = function( c ) {

	this.shader.uniforms.mode.value = this.params.mode;
	this.shader.uniforms.opacity.value = this.params.opacity;
	this.shader.uniforms.tInput2.value = this.params.tInput2;
	this.shader.uniforms.sizeMode.value = this.params.sizeMode;
	this.shader.uniforms.aspectRatio.value = this.params.aspectRatio;
	this.shader.uniforms.aspectRatio2.value = this.params.aspectRatio2;

	c.pass( this.shader );

};


WAGNER.BoxBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'BoxBlurPass Pass constructor' );
	this.loadShader( 'box-blur2-fs' );
	this.params.delta = new THREE.Vector2( 0, 0 );
	this.params.taps = 1;

};

WAGNER.BoxBlurPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.BoxBlurPass.prototype.run = function( c ) {

	this.shader.uniforms.delta.value.copy( this.params.delta );
	/*for( var j = 0; j < this.params.taps; j++ ) {
		this.shader.uniforms.delta.value.copy( this.params.delta );
		c.pass( this.shader );
	}*/
	c.pass( this.shader );

};


WAGNER.BrightnessContrastPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'BrightnessContrastPass constructor' );
	this.loadShader( 'brightness-contrast-fs' );

	this.params.brightness = 1;
	this.params.contrast = 1;

};

WAGNER.BrightnessContrastPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.BrightnessContrastPass.prototype.run = function( c ) {

	this.shader.uniforms.brightness.value = this.params.brightness;
	this.shader.uniforms.contrast.value = this.params.contrast;

	c.pass( this.shader );

};


WAGNER.CGAPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'CGA Pass constructor' );
	this.loadShader( 'cga-fs', function() {
		this.shader.uniforms.pixelDensity.value = window.devicePixelRatio;
	} );

};

WAGNER.CGAPass.prototype = Object.create( WAGNER.Pass.prototype );


/*

https://www.shadertoy.com/view/XssGz8

Simulates Chromatic Aberration by linearly interpolating blur-weights from red to green to blue.
Original idea by Kusma: https://github.com/kusma/vlee/blob/master/data/postprocess.fx
Barrel Blur forked from https://www.shadertoy.com/view/XslGz8

*/

WAGNER.ChromaticAberrationPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'ChromaticAberrationPass Pass constructor' );
	this.loadShader( 'chromatic-aberration-fs' );

};

WAGNER.ChromaticAberrationPass.prototype = Object.create( WAGNER.Pass.prototype );


WAGNER.CircularBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'CircularBlurPass Pass constructor' );
	this.loadShader( 'circular-blur-fs' );

};

WAGNER.CircularBlurPass.prototype = Object.create( WAGNER.Pass.prototype );


WAGNER.CopyPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'CopyPass constructor' );
	this.loadShader( 'copy-fs' );

};

WAGNER.CopyPass.prototype = Object.create( WAGNER.Pass.prototype );


WAGNER.CrossFadePass = function() {

  WAGNER.Pass.call( this );
  WAGNER.log( 'CrossFadePass Pass constructor' );
  this.loadShader( 'crossfade-fs' );

  this.params.tInput2 = null;
  this.params.tFadeMap = null;
  this.params.amount = 0;

};

WAGNER.CrossFadePass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.CrossFadePass.prototype.run = function( c ) {

  this.shader.uniforms.tInput2.value = this.params.tInput2;
  this.shader.uniforms.tFadeMap.value = this.params.tFadeMap;
  this.shader.uniforms.amount.value = this.params.amount;

  c.pass( this.shader );

};


WAGNER.DOFPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'DOFPass Pass constructor' );
	this.loadShader( 'dof-fs' );

	this.params.focalDistance = 0;
	this.params.aperture = .005;
	this.params.tBias = null;
	this.params.blurAmount = 1;

};

WAGNER.DOFPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.DOFPass.prototype.run = function( c ) {

	this.shader.uniforms.tBias.value = this.params.tBias;
	this.shader.uniforms.focalDistance.value = this.params.focalDistance;
	this.shader.uniforms.aperture.value = this.params.aperture;
	this.shader.uniforms.blurAmount.value = this.params.blurAmount;

	this.shader.uniforms.delta.value.set( 1, 0 );
	c.pass( this.shader );

	this.shader.uniforms.delta.value.set( 0, 1 );
	c.pass( this.shader );

};


WAGNER.DenoisePass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'Denoise Pass constructor' );
	this.loadShader( 'denoise-fs' );

	this.params.exponent = 5;
	this.params.strength = 10;

};

WAGNER.DenoisePass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.DenoisePass.prototype.run = function( c ) {

	this.shader.uniforms.exponent.value = this.params.exponent;
	this.shader.uniforms.strength.value = this.params.strength;
	c.pass( this.shader );

};


WAGNER.DirectionalBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'Directional Blur Pass constructor' );
	this.loadShader( 'guided-directional-blur-fs', function( fs ) {

	} );

	this.params.tBias = null;
	this.params.delta = .1;

}

WAGNER.DirectionalBlurPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.DirectionalBlurPass.prototype.run = function( c ) {

	this.shader.uniforms.tBias.value = this.params.tBias;
	this.shader.uniforms.delta.value = this.params.delta;

	c.pass( this.shader );

};


WAGNER.DirtPass = function() {

	WAGNER.Pass.call( this );
	this.blendPass = new WAGNER.BlendPass();
	this.dirtTexture = THREE.ImageUtils.loadTexture( WAGNER.assetsPath + '/textures/dirt8.jpg' );

	this.params.blendMode = WAGNER.BlendMode.SoftLight;

};

WAGNER.DirtPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.DirtPass.prototype.isLoaded = function() {

	if( this.blendPass.isLoaded() ) {
		this.loaded = true;
	}
	return WAGNER.Pass.prototype.isLoaded.call( this );

};

WAGNER.DirtPass.prototype.run = function( c ) {

	this.blendPass.params.sizeMode = 1;
	this.blendPass.params.mode = this.params.blendMode;
	this.blendPass.params.tInput2 = this.dirtTexture;
	if( this.dirtTexture.image ) {
		this.blendPass.params.resolution2.set( this.dirtTexture.image.width, this.dirtTexture.image.height );
		this.blendPass.params.aspectRatio2 = this.dirtTexture.image.width / this.dirtTexture.image.height;
	}
	this.blendPass.params.aspectRatio = c.read.width / c.read.height;
	c.pass( this.blendPass );

};


WAGNER.DotScreenPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'DotScreenPass Pass constructor' );
	this.loadShader( 'dot-screen-fs' );

};

WAGNER.DotScreenPass.prototype = Object.create( WAGNER.Pass.prototype );


WAGNER.FXAAPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'FXAA Pass constructor' );
	this.loadShader( 'fxaa-fs' );

};

WAGNER.FXAAPass.prototype = Object.create( WAGNER.Pass.prototype );


WAGNER.FreiChenEdgeDetectionPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'FreiChenEdgeDetectionPass Pass constructor' );
	this.loadShader( 'frei-chen-fs' );

};

WAGNER.FreiChenEdgeDetectionPass.prototype = Object.create( WAGNER.Pass.prototype );


WAGNER.FullBoxBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'FullBoxBlurPass Pass constructor' );
	this.boxPass = new WAGNER.BoxBlurPass();
	this.params.amount = 20;
	this.params.taps = 1;

};

WAGNER.FullBoxBlurPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.FullBoxBlurPass.prototype.isLoaded = function() {

	if( this.boxPass.isLoaded() ) {
		this.loaded = true;
	}
	return WAGNER.Pass.prototype.isLoaded.call( this );

};

WAGNER.FullBoxBlurPass.prototype.run = function( c ) {

	var s = this.params.amount;
	this.boxPass.params.delta.set( s, 0 );
	this.boxPass.params.taps = this.params.taps;
	c.pass( this.boxPass );
	this.boxPass.params.delta.set( 0, s );
	c.pass( this.boxPass );

};


WAGNER.GrayscalePass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'GrayscalePass Pass constructor' );
	this.loadShader( 'grayscale-fs' );

};

WAGNER.GrayscalePass.prototype = Object.create( WAGNER.Pass.prototype );


WAGNER.GuidedBoxBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'GuidedBoxBlurPass Pass constructor' );
	this.loadShader( 'guided-box-blur2-fs' );

	this.params.tBias = null;
	this.params.delta = new THREE.Vector2( 1., 0 );
	this.params.invertBiasMap = false;
	this.params.isPacked = 0;
	this.params.from = 0;
	this.params.to = 1;

};

WAGNER.GuidedBoxBlurPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.GuidedBoxBlurPass.prototype.run = function( c ) {

	this.shader.uniforms.tBias.value = this.params.tBias,
	this.shader.uniforms.delta.value.copy( this.params.delta );
	this.shader.uniforms.delta.value.multiplyScalar( .0001 );
	this.shader.uniforms.invertBiasMap.value = this.params.invertBiasMap;
	this.shader.uniforms.isPacked.value = this.params.isPacked;
	this.shader.uniforms.from.value = this.params.from;
	this.shader.uniforms.to.value = this.params.to;
	c.pass( this.shader );

};


WAGNER.GuidedFullBoxBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'FullBoxBlurPass Pass constructor' );
	this.guidedBoxPass = new WAGNER.GuidedBoxBlurPass();

	this.params.tBias = null;
	this.params.invertBiasMap = false;
	this.params.isPacked = 0;
	this.params.amount = 10;
	this.params.from = 0;
	this.params.to = 1;
	this.params.taps = 1;

};

WAGNER.GuidedFullBoxBlurPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.GuidedFullBoxBlurPass.prototype.isLoaded = function() {

	if( this.guidedBoxPass.isLoaded() ) {
		this.loaded = true;
	}
	return WAGNER.Pass.prototype.isLoaded.call( this );

};

WAGNER.GuidedFullBoxBlurPass.prototype.run = function( c ) {

	this.guidedBoxPass.params.invertBiasMap = this.params.invertBiasMap;
	this.guidedBoxPass.params.isPacked = this.params.isPacked;
	this.guidedBoxPass.params.tBias = this.params.tBias;
	this.guidedBoxPass.params.from = this.params.from;
	this.guidedBoxPass.params.to = this.params.to;
	var s = this.params.amount;
	for( var j = 0; j < this.params.taps; j++ ) {
		this.guidedBoxPass.params.delta.set( s, 0 );
		c.pass( this.guidedBoxPass );
		this.guidedBoxPass.params.delta.set( 0, s );
		c.pass( this.guidedBoxPass );
	}

};


WAGNER.Halftone2Pass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'Halftone2Pass Pass constructor' );
	this.loadShader( 'halftone2-fs' );

	this.params.amount = 128;
	this.params.smoothness = .25;

};

WAGNER.Halftone2Pass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.Halftone2Pass.prototype.run = function( c ) {

	this.shader.uniforms.amount.value = this.params.amount;
	this.shader.uniforms.smoothness.value = this.params.smoothness;

	c.pass( this.shader );

};


WAGNER.HalftoneCMYKPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'HalftoneCMYKPass Pass constructor' );
	this.loadShader( 'halftone-cmyk-fs', function() {

	} );

};

WAGNER.HalftoneCMYKPass.prototype = Object.create( WAGNER.Pass.prototype );


WAGNER.HalftonePass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'HalftonePass Pass constructor' );
	this.loadShader( 'halftone-fs', function() {
		this.shader.uniforms.pixelSize.value = 6;
	} );

};

WAGNER.HalftonePass.prototype = Object.create( WAGNER.Pass.prototype );


WAGNER.HighPassPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'HighPass Pass constructor' );
	this.loadShader( 'high-pass-fs' );

};

WAGNER.HighPassPass.prototype = Object.create( WAGNER.Pass.prototype );


WAGNER.InvertPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'InvertPass constructor' );
	this.loadShader( 'invert-fs' );

};

WAGNER.InvertPass.prototype = Object.create( WAGNER.Pass.prototype );


WAGNER.LEDPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'LEDPass Pass constructor' );
	this.loadShader( 'led-fs', function() {

		//this.shader.uniforms.noiseTexture.value = 1;
	} );

	this.params.pixelSize = 10;
	this.params.tolerance = .25;
	this.params.pixelRadius = .25;
	this.params.luminanceSteps = 100;
	this.params.luminanceBoost = .2;
	this.params.colorBoost = .01;
	this.params.burntOutPercent = 50;
};

WAGNER.LEDPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.LEDPass.prototype.run = function( c ) {

	this.shader.uniforms.pixelSize.value = this.params.pixelSize;
	this.shader.uniforms.tolerance.value = this.params.tolerance;
	this.shader.uniforms.pixelRadius.value = this.params.pixelRadius;
	this.shader.uniforms.luminanceSteps.value = this.params.luminanceSteps;
	this.shader.uniforms.luminanceBoost.value = this.params.luminanceBoost;
	this.shader.uniforms.colorBoost.value = this.params.colorBoost;
	this.shader.uniforms.burntOutPercent.value = this.params.burntOutPercent;

	c.pass( this.shader );

};


WAGNER.MultiPassBloomPass = function( w, h ) {

	WAGNER.Pass.call( this );
	WAGNER.log( 'MultiPassBloomPass Pass constructor' );

	this.composer = null;

	this.tmpTexture  = this.getOfflineTexture( w, h, true );
	this.blurPass    = new WAGNER.FullBoxBlurPass();
	this.blendPass   = new WAGNER.BlendPass();
	this.zoomBlur    = new WAGNER.ZoomBlurPass();
	this.brightnessContrastPass = new WAGNER.BrightnessContrastPass();

	this.width = w || 512;
	this.height = h || 512;

	this.params.blurAmount = 20;
	this.params.applyZoomBlur = false;
	this.params.zoomBlurStrength = 2;
	this.params.useTexture = false;
	this.params.zoomBlurCenter = new THREE.Vector2( 0,0 );
	this.params.blendMode = WAGNER.BlendMode.Screen;

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
		this.composer.setSize( this.width, this.height );
		//this.composer.setSize( this.tmpTexture.width, this.tmpTexture.height );
	}

	/*var s = 0.5;
	if( c.width != this.tmpTexture.width / s || c.height != this.tmpTexture.height / s ) {
		this.tmpTexture  = this.getOfflineTexture( c.width * s, c.height * s, true );
		this.composer.setSize( this.tmpTexture.width, this.tmpTexture.height );
	}*/

	this.composer.reset();

	if( this.params.useTexture === true ) {
		this.composer.setSource( this.params.glowTexture );
	} else {
		this.composer.setSource( c.output );
		/*this.brightnessContrastPass.params.brightness = -1;
		this.brightnessContrastPass.params.contrast = 5;
		this.composer.pass( this.brightnessContrastPass );*/
	}

	this.blurPass.params.amount = this.params.blurAmount;
	this.composer.pass( this.blurPass );
	
	if( this.params.applyZoomBlur ) {
		this.zoomBlur.params.center.set( .5 * this.composer.width, .5 * this.composer.height );
		this.zoomBlur.params.strength = this.params.zoomBlurStrength;
		this.composer.pass( this.zoomBlur );
	}

	if( this.params.useTexture === true ) {
		this.blendPass.params.mode = WAGNER.BlendMode.Screen;
		this.blendPass.params.tInput = this.params.glowTexture;
		c.pass( this.blendPass );
	}

	this.blendPass.params.mode = this.params.blendMode;
	this.blendPass.params.tInput2 = this.composer.output;
	c.pass( this.blendPass );
	
};


WAGNER.NoisePass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'Noise Pass constructor' );
	this.loadShader( 'noise-fs' );

	this.params.amount = 0.1;
	this.params.speed = 0;

};

WAGNER.NoisePass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.NoisePass.prototype.run = function( c ) {

	this.shader.uniforms.amount.value = this.params.amount;
	this.shader.uniforms.speed.value = this.params.speed;
	c.pass( this.shader );

};


WAGNER.OldVideoPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'OldVideoPass Pass constructor' );
	this.loadShader( 'old-video-fs' );

};

WAGNER.OldVideoPass.prototype = Object.create( WAGNER.Pass.prototype );


WAGNER.PixelatePass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'PixelatePass Pass constructor' );
	this.loadShader( 'pixelate-fs' );

	this.params.amount = 320;

};

WAGNER.PixelatePass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.PixelatePass.prototype.run = function( c ) {

	this.shader.uniforms.amount.value = this.params.amount;
	c.pass( this.shader );

};


WAGNER.PoissonDiscBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'PoissonDiscBlurPass Pass constructor' );
	this.loadShader( 'poisson-disc-blur-fs' );

};

WAGNER.PoissonDiscBlurPass.prototype = Object.create( WAGNER.Pass.prototype );


WAGNER.RGBSplitPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'RGBSplitPass Pass constructor' );
	this.loadShader( 'rgb-split-fs', function() {
	} );

	this.params.delta = new THREE.Vector2();

};

WAGNER.RGBSplitPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.RGBSplitPass.prototype.run = function( c ) {

	this.shader.uniforms.delta.value.copy( this.params.delta );
	c.pass( this.shader );

};


WAGNER.SSAOPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'SSAOPass Pass constructor' );
	this.loadShader( 'ssao-fs', function( fs ) {

		/*this.shader.uniforms.pSphere.value = [
			new THREE.Vector3(-0.010735935, 0.01647018, 0.0062425877),
			new THREE.Vector3(-0.06533369, 0.3647007, -0.13746321),
			new THREE.Vector3(-0.6539235, -0.016726388, -0.53000957),
			new THREE.Vector3(0.40958285, 0.0052428036, -0.5591124),
			new THREE.Vector3(-0.1465366, 0.09899267, 0.15571679),
			new THREE.Vector3(-0.44122112, -0.5458797, 0.04912532),
			new THREE.Vector3(0.03755566, -0.10961345, -0.33040273),
			new THREE.Vector3(0.019100213, 0.29652783, 0.066237666),
			new THREE.Vector3(0.8765323, 0.011236004, 0.28265962),
			new THREE.Vector3(0.29264435, -0.40794238, 0.15964167)
		];*/

	} );

	this.params.texture = null;
	this.params.isPacked = false;
	this.params.onlyOcclusion = false;

	this.blurPass = new WAGNER.FullBoxBlurPass();
	this.blendPass = new WAGNER.BlendPass();
	this.composer = null;

};

WAGNER.SSAOPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.SSAOPass.prototype.run = function( c ) {

	if( !this.composer ) {
		var s = 4;
		this.composer = new WAGNER.Composer( c.renderer, { useRGBA: true } );
		this.composer.setSize( c.width / s, c.height / s );
	}

	this.composer.reset();

	this.composer.setSource( c.output );

	this.shader.uniforms.tDepth.value = this.params.texture;
	//this.shader.uniforms.isPacked.value = this.params.isPacked;
	this.shader.uniforms.onlyOcclusion.value = this.params.onlyOcclusion;
	this.composer.pass( this.shader );

	this.blurPass.params.amount = .1;
	this.composer.pass( this.blurPass );

	if( this.params.onlyOcclusion ) {
		c.setSource( this.composer.output );
	} else {
		this.blendPass.params.mode = WAGNER.BlendMode.Multiply;
		this.blendPass.params.tInput2 = this.composer.output;

		c.pass( this.blendPass );
	}

};


WAGNER.SepiaPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'SepiaPass constructor' );
	this.loadShader( 'sepia-fs' );

	this.params.amount = 1;

};

WAGNER.SepiaPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.SepiaPass.prototype.run = function( c ) {

	this.shader.uniforms.amount.value = this.params.amount;
	c.pass( this.shader );

};


WAGNER.SimpleSSAOPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'SimpleSSAOPass Pass constructor' );
	this.loadShader( 'ssao-simple-fs', function( fs ) {
	} );

	this.params.texture = null;
	this.params.onlyOcclusion = 0;
	this.params.zNear = 1;
	this.params.zFar = 10000;
	this.params.strength = 1;

};

WAGNER.SimpleSSAOPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.SimpleSSAOPass.prototype.run = function( c ) {

	this.shader.uniforms.tDepth.value = this.params.texture;
//	this.shader.uniforms.onlyOcclusion.value = this.params.onlyOcclusion;
	this.shader.uniforms.zNear.value = this.params.zNear;
	this.shader.uniforms.zFar.value = this.params.zFar;
	this.shader.uniforms.strength.value = this.params.strength;

	c.pass( this.shader );

};


WAGNER.SobelEdgeDetectionPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'SobelEdgeDetectionPass Pass constructor' );
	this.loadShader( 'sobel-fs' );

};

WAGNER.SobelEdgeDetectionPass.prototype = Object.create( WAGNER.Pass.prototype );


WAGNER.SymetricPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'SymetricPass constructor' );
	this.loadShader( 'symetric-fs' );

	this.params.xReverse = false;
	this.params.yReverse = false;
	this.params.xMirror = false;
	this.params.yMirror = false;
	this.params.mirrorCenter = new THREE.Vector2( 0.5, 0.5);
	this.params.angle = 0;


};

WAGNER.SymetricPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.SymetricPass.prototype.run = function( c ) {

	this.shader.uniforms.xReverse.value = this.params.xReverse;
	this.shader.uniforms.yReverse.value = this.params.yReverse;
	this.shader.uniforms.xMirror.value = this.params.xMirror;
	this.shader.uniforms.yMirror.value = this.params.yMirror;
	this.shader.uniforms.mirrorCenter.value = this.params.mirrorCenter;
	this.shader.uniforms.angle.value = this.params.angle;
	c.pass( this.shader );

};


WAGNER.ToonPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'ToonPass Pass constructor' );
	this.loadShader( 'toon-fs' );

};

WAGNER.ToonPass.prototype = Object.create( WAGNER.Pass.prototype );


WAGNER.Vignette2Pass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'Vignette Pass constructor' );
	this.loadShader( 'vignette2-fs' );

	this.params.boost = 2;
	this.params.reduction = 2;

};

WAGNER.Vignette2Pass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.Vignette2Pass.prototype.run = function( c ) {

	this.shader.uniforms.boost.value = this.params.boost;
	this.shader.uniforms.reduction.value = this.params.reduction;
	c.pass( this.shader );

};


WAGNER.VignettePass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'Vignette Pass constructor' );
	this.loadShader( 'vignette-fs' );

	this.params.amount = 1;
	this.params.falloff = 0.1;

};

WAGNER.VignettePass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.VignettePass.prototype.run = function( c ) {

	this.shader.uniforms.amount.value = this.params.amount;
	this.shader.uniforms.falloff.value = this.params.falloff;
	c.pass( this.shader );

};


WAGNER.ZoomBlurPass = function() {

	WAGNER.Pass.call( this );
	WAGNER.log( 'ZoomBlurPass Pass constructor' );
	this.loadShader( 'zoom-blur-fs' );

	this.params.center = new THREE.Vector2( 0.5, 0.5 );
	this.params.strength = 2;

};

WAGNER.ZoomBlurPass.prototype = Object.create( WAGNER.Pass.prototype );

WAGNER.ZoomBlurPass.prototype.run = function( c ) {

	this.shader.uniforms.center.value.copy ( this.params.center );
	this.shader.uniforms.strength.value = this.params.strength;
	c.pass( this.shader );

};


	this.WAGNER = WAGNER;
}).call(this);
