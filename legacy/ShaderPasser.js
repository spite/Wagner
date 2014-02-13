
var Composer = function( source, settings ) {

	var _source = source,
		_settings = settings || {},
		_shaders = {};

	_settings.scale = _settings.scale || 1;

	var _scene = new THREE.Scene();
	var _camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, -10000, 10000 );
	
	var _read = new THREE.WebGLRenderTarget( window.innerWidth / _settings.scale, window.innerHeight / _settings.scale, { 
		minFilter: THREE.LinearFilter, 
		magFilter: THREE.LinearFilter, 
		format: THREE.RGBFormat 
	} );
	
	var _write = _read.clone();

	window.addEventListener( 'resize', _resize );

	var blitShader = new THREE.ShaderMaterial( {

		uniforms: { 
			tDiffuse: { type: "t", value: 0, texture: _read }
		},
		vertexShader: document.getElementById( 'vertexShader' ).textContent,
		fragmentShader: document.getElementById( 'fs_Normal' ).textContent,
		
		depthWrite: false,
		depthTest: false

	} );
	
	_source = _read;
	
	var _quad = new THREE.Mesh( new THREE.PlaneGeometry( 1, 1 ), blitShader );
	_quad.position.z = -100;
	_scene.add( _quad );

	_resize();
	
	function _resize() {

		//_read.width = _write.width = window.innerWidth / _settings.scale;
		//_read.height = _write.height = window.innerHeight / _settings.scale;
		_camera.projectionMatrix.makeOrthographic( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, -10000, 10000 );
		_quad.scale.set( window.innerWidth, window.innerHeight );
		_quad.updateMatrix();

	}

	function _reset( source ) {
	
		_source = source?source:_read;
		_target = _write;

	}
	
	function _applyShader( a, b ) {

		if( a instanceof THREE.Scene ) {
			_target.width = window.innerWidth / _settings.scale;
			_target.height = window.innerHeight / _settings.scale;
			_settings.renderer.render( a, b, _target, true );

			_quad.material.uniforms[ 'tDiffuse' ].value = _target;
			//if( _quad.material.uniforms[ 'resolution' ] ) _quad.material.uniforms[ 'resolution' ].value.set( window.innerWidth / _settings.scale, window.innerHeight / _settings.scale );
		} else {
			var shader = a;
			var uniforms = b;
			_quad.material = shader;
			_quad.material.uniforms[ 'tDiffuse' ].value = _source;
			for( var j in uniforms ) {
				_quad.material.uniforms[ j ].value = uniforms[ j ];
			}
			if( _quad.material.uniforms[ 'resolution' ] ) _quad.material.uniforms[ 'resolution' ].value.set( window.innerWidth / _settings.scale, window.innerHeight / _settings.scale );
			_settings.renderer.render( _scene, _camera, _target, false );
		}
		
		var tmp = _source;
		_source = _target;
		_target = tmp;
		
	}

	function _blit() {
		
		//_quad.material.wireframe = true;
		_settings.renderer.render( _scene, _camera );
		
	}

	function _clone( _output ) {

		_quad.material = blitShader;
		_quad.material.uniforms[ 'tDiffuse' ].value = _source;
		//if( _quad.material.uniforms[ 'resolution' ] ) _quad.material.uniforms[ 'resolution' ].value.set( window.innerWidth, window.innerHeight );
		_settings.renderer.render( _scene, _camera, _output, false );

	}
	
	return {
	
		pass: _applyShader,
		blit: _blit,
		get result(){ return _source; },
		set source( s ){ _source = s; },
		reset: _reset,
		clone: _clone
		
	}
	
}