var WAGNER = WAGNER || {};

WAGNER.Composer = function( renderer, settings ) {

	this.width = 1;
	this.height = 1;

	this.settings = settings || {};
	this.useRGBA = this.settings.useRGBA || false;

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

WAGNER.Composer.prototype.render = function( scene, camera ) {

	if( this.copyPass.isLoaded() ) {
		this.renderer.render( scene, camera, this.write, true );
		this.quad.material = this.copyPass.shader;
		this.quad.material.uniforms.tDiffuse.value = this.write;
		this.quad.material.uniforms.resolution.value.set( this.width, this.height );
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

WAGNER.Composer.prototype.createPass = function( fragmentShaderId, extraUniforms ) {

	var shaderCode = this.shaderLoader.get( fragmentShaderId );
	var regExp = /uniform\s+([^\s]+)\s+([^\s]+)\s*;/gi; 
	var regExp2 = /uniform\s+([^\s]+)\s+([^\s]+)\s*\[\s*(\d)\s*\]*\s*;/gi;

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

	var matches;
	var uniforms = {
		resolution: { type: 'v2', value: new THREE.Vector2( 1, 1 ) }
	};

	while( ( matches = regExp.exec( shaderCode ) ) != null) {
		if( matches.index === regExp.lastIndex) {
			regExp.lastIndex++;
		}
		var uniformType = matches[ 1 ],
			uniformName = matches[ 2 ];
		console.log( '  > ', uniformType, uniformName );
		uniforms[ uniformName ] = {
			type: typesMap[ uniformType ].type,
			value: typesMap[ uniformType ].value()
		};
	}

	while( ( matches = regExp2.exec( shaderCode ) ) != null) {
		if( matches.index === regExp.lastIndex) {
			regExp.lastIndex++;
		}
		var uniformType = matches[ 1 ],
			uniformName = matches[ 2 ];
		console.log( '  > ', uniformType, uniformName );
		uniforms[ uniformName ] = {
			type: typesMap[ uniformType ].type,
			value: typesMap[ uniformType ].value()
		};
	}

	var shader = new THREE.ShaderMaterial( {
		uniforms: uniforms,
		vertexShader: this.shaderLoader.get( 'orto-vs' ),
		fragmentShader: shaderCode,
		shading: THREE.FlatShading,
		depthWrite: false,
		depthTest: false,
		transparent: true
	} );

	return shader;

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

	var oReq = new XMLHttpRequest();
	oReq.onload = function() {
		var content = oReq.responseText;
		callback( content );
	}.bind( this );
	oReq.open( 'get', file, true );
	oReq.send();

}

WAGNER.processShader = function( vertexShaderCode, fragmentShaderCode ) {

	var regExp = /uniform\s+([^\s]+)\s+([^\s]+)\s*;/gi; 
	var regExp2 = /uniform\s+([^\s]+)\s+([^\s]+)\s*\[\s*(\d)\s*\]*\s*;/gi;

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

	var matches;
	var uniforms = {
		resolution: { type: 'v2', value: new THREE.Vector2( 1, 1 ) }
	};

	while( ( matches = regExp.exec( fragmentShaderCode ) ) != null) {
		if( matches.index === regExp.lastIndex) {
			regExp.lastIndex++;
		}
		var uniformType = matches[ 1 ],
			uniformName = matches[ 2 ];
		console.log( '  > ', uniformType, uniformName );
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
			uniformName = matches[ 2 ];
		console.log( '  > ', uniformType, uniformName );
		uniforms[ uniformName ] = {
			type: typesMap[ uniformType ].type,
			value: typesMap[ uniformType ].value()
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

	console.log( 'Pass constructor' );
	this.shader = null;
	this.loaded = null;

}

WAGNER.Pass.prototype.run = function( c ) {

	console.log( 'Pass run' );
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

WAGNER.Pass.prototype.getOfflineTexture = function( w, h ){

	var rtTexture = new THREE.WebGLRenderTarget( w, h, { 
		minFilter: THREE.LinearFilter, 
		magFilter: THREE.LinearFilter, 
		format: this.useRGBA?THREE.RGBAFormat:THREE.RGBFormat
	} );

	return rtTexture;

}

WAGNER.CopyPass = function() {

	WAGNER.Pass.call( this );
	console.log( 'CopyPass constructor' );
	var self = this;
	WAGNER.loadShader( 'orto-vs.glsl', function( vs ) {
		WAGNER.loadShader( 'copy-fs.glsl', function( fs ) {
			self.shader = WAGNER.processShader( vs, fs );
		} );
	} );

}

WAGNER.CopyPass.prototype = new WAGNER.Pass();

WAGNER.BlendPass = function() {

	WAGNER.Pass.call( this );
	console.log( 'BlendPass constructor' );
	var self = this;
	WAGNER.loadShader( 'orto-vs.glsl', function( vs ) {
		WAGNER.loadShader( 'blend-fs.glsl', function( fs ) {
			self.shader = WAGNER.processShader( vs, fs );
			self.shader.uniforms.mode.value = 1;
		} );
	} );

}

WAGNER.BlendPass.prototype = new WAGNER.Pass();

WAGNER.InvertPass = function() {

	WAGNER.Pass.call( this );
	console.log( 'InvertPass constructor' );
	var self = this;
	WAGNER.loadShader( 'orto-vs.glsl', function( vs ) {
		WAGNER.loadShader( 'invert-fs.glsl', function( fs ) {
			self.shader = WAGNER.processShader( vs, fs );
		} );
	} );

}

WAGNER.InvertPass.prototype = new WAGNER.Pass();

WAGNER.SepiaPass = function() {

	WAGNER.Pass.call( this );
	console.log( 'SepiaPass constructor' );
	var self = this;
	WAGNER.loadShader( 'orto-vs.glsl', function( vs ) {
		WAGNER.loadShader( 'sepia-fs.glsl', function( fs ) {
			self.shader = WAGNER.processShader( vs, fs );
			self.shader.uniforms.amount.value = 1.;
		} );
	} );

}

WAGNER.SepiaPass.prototype = new WAGNER.Pass();

WAGNER.NoisePass = function() {

	WAGNER.Pass.call( this );
	console.log( 'Denoise Pass constructor' );
	var self = this;
	WAGNER.loadShader( 'orto-vs.glsl', function( vs ) {
		WAGNER.loadShader( 'noise-fs.glsl', function( fs ) {
			self.shader = WAGNER.processShader( vs, fs );
			self.shader.uniforms.amount.value = .1;
		} );
	} );

}

WAGNER.NoisePass.prototype = new WAGNER.Pass();

WAGNER.VignettePass = function() {

	WAGNER.Pass.call( this );
	console.log( 'Vignette Pass constructor' );
	var self = this;
	WAGNER.loadShader( 'orto-vs.glsl', function( vs ) {
		WAGNER.loadShader( 'vignette-fs.glsl', function( fs ) {
			self.shader = WAGNER.processShader( vs, fs );
			self.shader.uniforms.amount.value = 1;
			self.shader.uniforms.size.value = .1;
		} );
	} );

}

WAGNER.VignettePass.prototype = new WAGNER.Pass();

WAGNER.Vignette2Pass = function() {

	WAGNER.Pass.call( this );
	console.log( 'Vignette Pass constructor' );
	var self = this;
	WAGNER.loadShader( 'orto-vs.glsl', function( vs ) {
		WAGNER.loadShader( 'vignette2-fs.glsl', function( fs ) {
			self.shader = WAGNER.processShader( vs, fs );
		} );
	} );

}

WAGNER.Vignette2Pass.prototype = new WAGNER.Pass();

WAGNER.DenoisePass = function() {

	WAGNER.Pass.call( this );
	console.log( 'Denoise Pass constructor' );
	var self = this;
	WAGNER.loadShader( 'orto-vs.glsl', function( vs ) {
		WAGNER.loadShader( 'denoise-fs.glsl', function( fs ) {
			self.shader = WAGNER.processShader( vs, fs );
			self.shader.uniforms.exponent.value = 5;
			self.shader.uniforms.strength.value = 10;
		} );
	} );

}

WAGNER.DenoisePass.prototype = new WAGNER.Pass();

WAGNER.BoxBlurPass = function() {

	WAGNER.Pass.call( this );
	console.log( 'BoxBlurPass Pass constructor' );
	var self = this;
	WAGNER.loadShader( 'orto-vs.glsl', function( vs ) {
		WAGNER.loadShader( 'box-blur-fs.glsl', function( fs ) {
			self.shader = WAGNER.processShader( vs, fs );
		} );
	} );

}

WAGNER.BoxBlurPass.prototype = new WAGNER.Pass();

WAGNER.FullBoxBlurPass = function() {

	WAGNER.Pass.call( this );
	console.log( 'FullBoxBlurPass Pass constructor' );
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
	console.log( 'ZoomBlurPass Pass constructor' );
	var self = this;
	WAGNER.loadShader( 'orto-vs.glsl', function( vs ) {
		WAGNER.loadShader( 'zoom-blur-fs.glsl', function( fs ) {
			self.shader = WAGNER.processShader( vs, fs );
			self.shader.uniforms.center.value.set( .5, .5 );
			self.shader.uniforms.strength.value = this.strength;
		} );
	} );

}

WAGNER.ZoomBlurPass.prototype = new WAGNER.Pass();

WAGNER.ZoomBlurPass.prototype.run = function( c ) {

	this.shader.uniforms.strength.value = this.strength;
	c.pass( this.shader );

}

WAGNER.MultiPassBloomPass = function() {

	WAGNER.Pass.call( this );
	console.log( 'MultiPassBloomPass Pass constructor' );

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

	var v = 5;

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
	console.log( 'CGA Pass constructor' );
	var self = this;
	WAGNER.loadShader( 'orto-vs.glsl', function( vs ) {
		WAGNER.loadShader( 'cga-fs.glsl', function( fs ) {
			self.shader = WAGNER.processShader( vs, fs );
			self.shader.uniforms.pixelDensity.value = window.devicePixelRatio;
		} );
	} );

}

WAGNER.CGAPass.prototype = new WAGNER.Pass();