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
