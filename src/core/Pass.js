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
	WAGNER.loadShader( WAGNER.fragmentShadersPath + '/' + id, function( fs ) {
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
