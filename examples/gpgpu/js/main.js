'use strict'

var container, renderer, scene, camera, mesh, material, fov = 70;
var numParticles = 64; //power fo 2
var limitToBounce = 512;
var composerPos, composerVel;
var velPass, posPass;
var controls;

var links = document.querySelectorAll( 'a[rel=external]' );
for ( var j = 0; j < links.length; j++ ) {
    var a = links[j];
    a.addEventListener( 'click', function ( e ) {
        window.open( this.href, '_blank' );
        e.preventDefault();
    }, false );
}

var c = document.body;
document.getElementById( 'fullscreenBtn' ).addEventListener( 'click', function ( e ) {
    c.onwebkitfullscreenchange = function ( e ) {
        c.onwebkitfullscreenchange = function () {
        };
    };
    c.onmozfullscreenchange = function ( e ) {
        c.onmozfullscreenchange = function () {
        };
    };
    if ( c.webkitRequestFullScreen ) c.webkitRequestFullScreen();
    if ( c.mozRequestFullScreen ) c.mozRequestFullScreen();
    e.preventDefault();
}, false );

window.addEventListener( 'load', function () {

    init();

} );

function init() {

    container = document.getElementById( 'container' );
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 1000;
    scene.add( camera );

    controls = new THREE.OrbitControls( camera );

    material = new THREE.ShaderMaterial( {

        uniforms: {

            "texture": { type: "t", value: null },
            "textureSize": { type: "f", value: numParticles },
            "pointSize": { type: "f", value: 3.0 }

        },
        vertexShader: document.getElementById( 'vs-particles' ).textContent,
        fragmentShader: document.getElementById( 'fs-particles' ).textContent,
        depthWrite: false,
        depthTest: false

    } );

    var geometry = new THREE.Geometry();

    for ( var i = 0, l = numParticles * numParticles; i < l; i++ ) {

        var vertex = new THREE.Vector3();
        vertex.x = ( i % numParticles ) / numParticles;
        vertex.y = Math.floor( i / numParticles ) / numParticles;
        vertex.z = 0;
        geometry.vertices.push( vertex );

    }

    var particles = new THREE.PointCloud( geometry, material );
    particles.sortParticles = false;
    scene.add( particles );

    renderer = new THREE.WebGLRenderer( { antialias: true, alpha: false } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setPixelRatio( window.devicePixelRatio );
    container.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize, false );

    initPass();

    onWindowResize();

    render();

}

function onWindowResize() {

    var s = 1,
        w = window.innerWidth,
        h = window.innerHeight;

    renderer.setSize( s * w, s * h );
    camera.projectionMatrix.makePerspective( fov, w / h, camera.near, camera.far );

    resizePass();

}

function render() {

    requestAnimationFrame( render );

    renderPass();

}