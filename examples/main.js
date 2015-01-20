'use strict'

var container, renderer, scene, camera, mesh, torus, material, fov = 70;
var model, quad, oculusEffect;
var light, composer;

var links = document.querySelectorAll( 'a[rel=external]' );
for( var j = 0; j < links.length; j++ ) {
    var a = links[ j ];
    a.addEventListener( 'click', function( e ) {
        window.open( this.href, '_blank' );
        e.preventDefault();
    }, false );
}

var c = document.body;
document.getElementById( 'fullscreenBtn' ).addEventListener( 'click', function( e ) {
	c.onwebkitfullscreenchange = function(e) {
		c.onwebkitfullscreenchange = function() {
		};
	};
	c.onmozfullscreenchange = function(e) {
		c.onmozfullscreenchange = function() {
		};
	};
	if( c.webkitRequestFullScreen ) c.webkitRequestFullScreen();
	if( c.mozRequestFullScreen ) c.mozRequestFullScreen();
	e.preventDefault();
}, false );

window.addEventListener( 'load', function() {

	init();
	
} );

/*
var rS = new rStats( {
	CSSPath: 'http://spite.github.io/rstats/',
	values: {
		frame: { caption: 'Total frame time (ms)', over: 16 },
        raf: { caption: 'Time since last rAF (ms)' },
        fps: { caption: 'Framerate (FPS)', below: 30 }
	},
	groups: [
		{ caption: 'Frame', values: [ 'frame', 'raf', 'fps' ] }
	]
} );*/


function init() {

	container = document.getElementById( 'container' );
	
	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.z = 1000;
	scene.add( camera );

	renderer = new THREE.WebGLRenderer( { antialias: true, alpha: false } );
	renderer.setSize( window.innerWidth, window.innerHeight );

    //oculusEffect = new THREE.OculusRiftEffect(renderer, {worldScale: 100});
    //oculusEffect.setSize( window.innerWidth, window.innerHeight );

	container.appendChild( renderer.domElement );

	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	container.addEventListener( 'mousewheel', onMouseWheel, false );
	container.addEventListener( 'DOMMouseScroll', onMouseWheel, false);
	window.addEventListener( 'resize', onWindowResize, false );

	var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 1024;

	var ambient = new THREE.AmbientLight( 0x444444 );
	scene.add( ambient );

	light = new THREE.SpotLight( 0xaaaaaa, 1, 0, Math.PI / 2, 1 );
	light.position.set( 0, 1500, 1000 );
	light.target.position.set( 0, 0, 0 );

	light.castShadow = true;

	light.shadowCameraNear = 1200;
	light.shadowCameraFar = 2500;
	light.shadowCameraFov = 90;

	//light.shadowCameraVisible = true;

	light.shadowBias = 0.0001;
	light.shadowDarkness = 0.5;

	light.shadowMapWidth = SHADOW_MAP_WIDTH;
	light.shadowMapHeight = SHADOW_MAP_HEIGHT;

	scene.add( light );

	renderer.shadowMapEnabled = true;
	renderer.shadowMapType = THREE.PCFShadowMap;

	initPass();

	onWindowResize();

	render();
	
}

var modelMaterial = new THREE.MeshPhongMaterial( { 
	map: THREE.ImageUtils.loadTexture( '../assets/textures/1324-decal.jpg' ), 
	normalMap: THREE.ImageUtils.loadTexture( '../assets/textures/1324-normal.jpg' ),
	shininess: 10,
	shading: THREE.SmoothShading
} );

function createTeapot() {

	var sphere = new THREE.Mesh( new THREE.IcosahedronGeometry( 2000, 4 ), new THREE.MeshNormalMaterial( { side: THREE.BackSide } ) );
	scene.add( sphere );

	var loader = new THREE.JSONLoader();
	loader.load( '../assets/models/teapot.js', function( data ) { 
		data.computeFaceNormals();
		data.computeVertexNormals();
		THREE.GeometryUtils.center( data );
		model = new THREE.Mesh( 
			data,
			modelMaterial
		);
		var scale = 10;
		model.scale.set ( scale, scale, scale );
		model.material.map.wrapS = model.material.map.wrapT = THREE.RepeatWrapping;
		model.material.map.repeat.set( 10, 10 );
		model.castShadow = true;
		model.receiveShadow = true;
		scene.add( model );
	} );

}

function createLeePerry() {

	var loader = new THREE.JSONLoader();
	loader.load( '../assets/models/LeePerrySmith.js', function( data ) { 
		data.computeFaceNormals();
		data.computeVertexNormals();
		THREE.GeometryUtils.center( data );
		model = new THREE.Mesh( 
			data,
			modelMaterial
		);
		var scale = 100;
		model.scale.set ( scale, scale, scale );
		model.material.map.wrapS = model.material.map.wrapT = THREE.RepeatWrapping;
		model.material.map.repeat.set( 4, 4 );
		model.castShadow = true;
		model.receiveShadow = true;
		scene.add( model );
	} );

}

function createCubes() {

	/*model = new THREE.Mesh( 
		new THREE.TorusKnotGeometry( 300, 100, 200, 50, 1, 3 ), 
		modelMaterial
	);
	model.material.map.wrapS = model.material.map.wrapT = THREE.RepeatWrapping;
	model.material.map.repeat.set( 8, 2 );
	model.scale.set( 4, 4,4 );*/

	var s = new THREE.CubeGeometry( 10, 10, 10, 1, 1 ,1 );
	//var s = new THREE.IcosahedronGeometry( 5, 3 );
	var g = new THREE.Geometry();
	var r = 2000;
	for( var j = 0; j < 100 ; j++ ) {
		var m = new THREE.Mesh( s, modelMaterial );
		m.rotation.set( Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI );
		m.position.set( ( .5 - Math.random() ) * r, ( .5 - Math.random() ) * r, ( .5 - Math.random() ) * r );
		var scale = 10 + Math.random() * 20;
		m.scale.set( scale, scale, scale );
		THREE.GeometryUtils.merge( g, m );
	}
	model = new THREE.Mesh( g, modelMaterial );
	model.castShadow = true;
	model.receiveShadow = true;

	scene.add( model );

}

function onWindowResize() {

	var s = 1,
		w = window.innerWidth,
		h = window.innerHeight;

	renderer.setSize( s * w, s * h );
	camera.projectionMatrix.makePerspective( fov, w / h, camera.near, camera.far );
	
	resizePass();

}

function onMouseWheel( event ) {

	// WebKit

	if ( event.wheelDeltaY ) {

		fov -= event.wheelDeltaY * 0.05;

	// Opera / Explorer 9

	} else if ( event.wheelDelta ) {

		fov -= event.wheelDelta * 0.05;

	// Firefox

	} else if ( event.detail ) {

		fov += event.detail * 1.0;

	}

	camera.projectionMatrix.makePerspective( fov, window.innerWidth / window.innerHeight, camera.near, camera.far );
	
}

var mouseX = 0, mouseY = 0;

function onDocumentMouseMove( e ) {

	mouseX = 10 * ( .5 * window.innerWidth - e.pageX );
	mouseY = 10 * ( .5 * window.innerHeight - e.pageY );

}

var startTime = Date.now();
var copy = true;

function render() {
	
	requestAnimationFrame( render );

	var t = .001 * Date.now();

	/*rS( 'frame' ).start();
    rS( 'rAF' ).tick();
    rS( 'FPS' ).frame();*/

	light.position.set( 0, 3000 * Math.cos( t ), 2000 * Math.sin( t ) );

	camera.position.x += ( mouseX - camera.position.x ) * .05;
	camera.position.y += ( - mouseY - camera.position.y ) * .05;
	camera.lookAt( scene.position );

	renderPass();

	startTime = t;

}