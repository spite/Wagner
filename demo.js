'use strict';

var composer;
var stack;

var rS = new rStats( {
    CSSPath: 'http://spite.github.io/rstats/',
    values: {
        frame: {
            caption: 'Total frame time (ms)',
            over: 16
        },
        raf: {
            caption: 'Time since last rAF (ms)'
        },
        fps: {
            caption: 'Framerate (FPS)',
            below: 30
        }
    },
    groups: [ {
        caption: 'Frame',
        values: [ 'frame', 'raf', 'fps' ]
    } ]
} );

var links = document.querySelectorAll( 'a[rel=external]' );
for ( var j = 0; j < links.length; j++ ) {
    var a = links[ j ];
    a.addEventListener( 'click', function ( e ) {
        window.open( this.href, '_blank' );
        e.preventDefault();
    }, false );
}

var container, renderer, scene, camera, mesh, torus, material, fov = 70;
var model, quad, oculusEffect;
var light;
var controls;

var composerSim;

var particles, particleMaterial;

var depthTexture, normalTexture, colorTexture, uvTexture, scaledTexture, glowTexture;
var depthMaterial; // = new THREE.MeshDepthMaterial();
var modelMaterial = new THREE.MeshPhongMaterial( {
    map: THREE.ImageUtils.loadTexture( 'assets/textures/1324.jpg' ),
    normalMap: THREE.ImageUtils.loadTexture( 'assets/textures/1324-normal.jpg' ),
    normalScale: new THREE.Vector2( 0.8, -0.8 ),
    shininess: 100
} );
var glowMaterial = new THREE.MeshBasicMaterial( {
    emissive: 0xffffff,
    map: THREE.ImageUtils.loadTexture( 'assets/textures/1324-glow.jpg' )
} );
var uvMaterial = new THREE.MeshBasicMaterial();


var shaders = [];

var sL = new ShaderLoader();
sL.add( 'depth-vs', 'vertex-shaders/packed-depth-vs.glsl' );
sL.add( 'depth-fs', 'fragment-shaders/packed-depth-fs.glsl' );
sL.load();
sL.onLoaded( function () {
    depthMaterial = new THREE.ShaderMaterial( {
        uniforms: {
            mNear: {
                type: 'f',
                value: 1
            },
            mFar: {
                type: 'f',
                value: 1000
            }
        },
        vertexShader: this.get( 'depth-vs' ),
        fragmentShader: this.get( 'depth-fs' ),
        shading: THREE.SmoothShading
    } );
} );

/*var sL = new ShaderLoader()
sL.add( 'uv-vs', 'vertex-shaders/packed-depth-vs.glsl' );
sL.add( 'uv-fs', 'fragment-shaders/uv-material-fs.glsl' );
sL.load();
sL.onLoaded( function() {
    uvMaterial = new THREE.ShaderMaterial( {
        uniforms: {
            mNear: { type: 'f', value: 1 },
            mFar: { type: 'f', value: 10000 },
            repeat: { type: 'v2', value: new THREE.Vector2( 1, 1 ) }
        },
        vertexShader: this.get( 'uv-vs' ),
        fragmentShader: this.get( 'uv-fs' ),
        shading: THREE.SmoothShading
    } );
} );*/

var c = document.body;
document.getElementById( 'fullscreenBtn' ).addEventListener( 'click', function ( e ) {
    c.onwebkitfullscreenchange = function ( e ) {
        c.onwebkitfullscreenchange = function () {};
    };
    c.onmozfullscreenchange = function ( e ) {
        c.onmozfullscreenchange = function () {};
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

    renderer = new THREE.WebGLRenderer( {
        antialias: false,
        alpha: false
    } );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 1000;
    scene.add( camera );

    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.dampening = 0.2;


    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setPixelRatio( window.devicePixelRatio );

    //oculusEffect = new THREE.OculusRiftEffect(renderer, {worldScale: 100});
    //oculusEffect.setSize( window.innerWidth, window.innerHeight );

    container.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize, false );

    var useTeapot = false;

    if ( useTeapot ) {

        var loader = new THREE.JSONLoader();
        loader.load( 'assets/models/LeePerrySmith.js', function ( data ) {
            data.computeCentroids();
            data.computeFaceNormals();
            data.computeVertexNormals();
            THREE.GeometryUtils.center( data );
            model = new THREE.Mesh(
                data,
                modelMaterial
            );
            var scale = 100;
            model.scale.set( scale, scale, scale );
            model.material.map.wrapS = model.material.map.wrapT = THREE.RepeatWrapping;
            model.material.map.repeat.set( 4, 400 );
            scene.add( model );
        } );

    } else {

        /*model = new THREE.Mesh( 
            new THREE.TorusKnotGeometry( 300, 100, 200, 50, 1, 3 ), 
            modelMaterial
        );
        model.material.map.wrapS = model.material.map.wrapT = THREE.RepeatWrapping;
        model.material.map.repeat.set( 8, 2 );
        model.scale.set( 4, 4,4 );*/

        var s = new THREE.CubeGeometry( 10, 10, 10, 1, 1, 1 );
        //var s = new THREE.IcosahedronGeometry( 5, 3 );
        var g = new THREE.Geometry();
        var r = 2000;
        for ( var j = 0; j < 100; j++ ) {
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

    var SHADOW_MAP_WIDTH = 2048,
        SHADOW_MAP_HEIGHT = 1024;

    var ambient = new THREE.AmbientLight( 0x444444 );
    scene.add( ambient );

    light = new THREE.SpotLight( 0xffffff, 1, 0, Math.PI / 2, 1 );
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

    composer = new WAGNER.Composer( renderer, {
        useRGBA: true
    } );

    stack = new WAGNER.Stack();

    initShaders();

    onWindowResize();

    render();

}

var tTexture;

function onWindowResize() {

    var s = 1,
        w = window.innerWidth,
        h = window.innerHeight;

    renderer.setSize( s * w, s * h );
    camera.projectionMatrix.makePerspective( fov, w / h, camera.near, camera.far );
    composer.setSize( w, h );
    depthTexture = WAGNER.Pass.prototype.getOfflineTexture( w, h, true );
    /*normalTexture = WAGNER.Pass.prototype.getOfflineTexture( w, h );
    colorTexture = WAGNER.Pass.prototype.getOfflineTexture( w, h, true );
    uvTexture = WAGNER.Pass.prototype.getOfflineTexture( w, h, true );
    scaledTexture = WAGNER.Pass.prototype.getOfflineTexture( 512, 512, true )
    glowTexture = WAGNER.Pass.prototype.getOfflineTexture( w, h, false );

    tTexture = WAGNER.Pass.prototype.getOfflineTexture( 100, 100, false );*/
}

var startTime = Date.now();
var copy = true;

function render() {

    var t = 0.001 * Date.now();

    rS( 'frame' ).start();
    rS( 'rAF' ).tick();
    rS( 'FPS' ).frame();

    //light.position.set( 0, 3000 * Math.cos( t ), 2000 * Math.sin( t ) );

    if ( model ) {
        /*model.rotation.x += .001;
        model.rotation.y += .001;
        model.rotation.z += .005;*/

        renderer.autoClearColor = true;
        composer.reset();

        model.material = depthMaterial;
        composer.render( scene, camera, null, depthTexture );

        model.material = modelMaterial;
        composer.render( scene, camera );



        // shaders.forEach( function ( shader ) {
        //     if ( shader.active ) {

        //         if ( shader.pass.params && shader.pass.params.tBias ) {

        //             shader.pass.params.tBias = depthTexture;

        //         }


        //     }
        // } );

        composer.pass( stack );
        composer.toScreen();

    }

    rS( 'frame' ).end();
    rS().update();

    requestAnimationFrame( render );
    startTime = t;

}

function toType ( obj ) {
    return ( {} ).toString.call( obj ).match( /\s([a-zA-Z]+)/ )[ 1 ].toLowerCase()
}

function initShaders () {

    shaders = [ {
            name: 'invertPass',
            pass: new WAGNER.InvertPass()
        }, {
            name: 'fxaaPass',
            pass: new WAGNER.FXAAPass()
        }, {
            name: 'ssaoPass',
            pass: new WAGNER.SSAOPass()
        }, {
            name: 'sepiaPass',
            pass: new WAGNER.SepiaPass()
        }, {
            name: 'boxBlurPass',
            pass: new WAGNER.BoxBlurPass()
        }, {
            name: 'fullBoxBlurPass',
            pass: new WAGNER.FullBoxBlurPass()
        }, {
            name: 'zoomBlurPass',
            pass: new WAGNER.ZoomBlurPass()
        }, {
            name: 'multiPassBloomPass',
            pass: new WAGNER.MultiPassBloomPass()
        }, {
            name: 'denoisePass',
            pass: new WAGNER.DenoisePass()
        }, {
            name: 'CGAPass',
            pass: new WAGNER.CGAPass()
        }, {
            name: 'sobelEdgeDetectionPass',
            pass: new WAGNER.SobelEdgeDetectionPass()
        }, {
            name: 'blendPass',
            pass: new WAGNER.BlendPass()
        }, {
            name: 'guidedBoxPass',
            pass: new WAGNER.GuidedBoxBlurPass()
        }, {
            name: 'guidedFullBoxBlurPass',
            pass: new WAGNER.GuidedFullBoxBlurPass()
        }, {
            name: 'pixelatePass',
            pass: new WAGNER.PixelatePass()
        }, {
            name: 'rgbSplitPass',
            pass: new WAGNER.RGBSplitPass()
        }, {
            name: 'chromaticAberrationPass',
            pass: new WAGNER.ChromaticAberrationPass()
        }, {
            name: 'barrelBlurPass',
            pass: new WAGNER.BarrelBlurPass()
        }, {
            name: 'oldVideoPass',
            pass: new WAGNER.OldVideoPass()
        }, {
            name: 'dotScreenPass',
            pass: new WAGNER.DotScreenPass()
        }, {
            name: 'circularBlur',
            pass: new WAGNER.CircularBlurPass()
        }, {
            name: 'poissonDiscBlur',
            pass: new WAGNER.PoissonDiscBlurPass()
        }, {
            name: 'vignettePass',
            pass: new WAGNER.VignettePass()
        }, {
            name: 'vignette2Pass',
            pass: new WAGNER.Vignette2Pass()
        }, {
            name: 'freiChenEdgeDetectionPass',
            pass: new WAGNER.FreiChenEdgeDetectionPass()
        }, {
            name: 'toonPass',
            pass: new WAGNER.ToonPass()
        }, {
            name: 'highPassPass',
            pass: new WAGNER.HighPassPass()
        }, {
            name: 'grayscalePass',
            pass: new WAGNER.GrayscalePass()
        }, {
            name: 'asciiPass',
            pass: new WAGNER.ASCIIPass()
        }, {
            name: 'ledPass',
            pass: new WAGNER.LEDPass()
        }, {
            name: 'halftonePass',
            pass: new WAGNER.HalftonePass()
        }, {
            name: 'dirtPass',
            pass: new WAGNER.DirtPass()
        }, {
            name: 'noisePass',
            pass: new WAGNER.NoisePass()
        }

        // {
        //      name: 'halftoneCMYKPass',
        //      pass: new WAGNER.HalftoneCMYKPass(),
        // },

    ];





    // shaders.multiPassBloomPass.params.blurAmount = 2;
    // shaders.guidedFullBoxBlurPass.params.amount = 20;
    // shaders.guidedFullBoxBlurPass.params.invertBiasMap = true;



    var gui = new dat.GUI();
    // gui.add(shaders.multiPassBloomPass.params, 'blurAmount', 0, 10 );

    shaders.forEach( function ( shaderItem, index ) {

        // store shader name so we can access later in GUI
        shaderItem.pass.name = shaderItem.name;

        // add pass to composer stack
        stack.addPass(shaderItem.pass);

        // init datGUI
        var shaderFolder = gui.addFolder( shaderItem.name );
        var shaderParams = shaderItem.pass.params;

        var enabledController = shaderFolder.add( shaderItem.pass, 'enabled' );

        enabledController.onChange( function() {

            updateEnabledShadersList();

        });
 
        for ( var paramName in shaderParams ) {

            if ( shaderParams.hasOwnProperty( paramName ) ) {

                var paramType = toType( shaderParams[ paramName ] );

                if ( paramType === 'number' ||
                    paramType === 'boolean' ||
                    paramType === 'string' ) {

                    shaderFolder.add( shaderParams, paramName );

                } else if ( paramType === 'object' ) {

                    var paramFolder = shaderFolder.addFolder( paramName );

                    for ( var subParamName in shaderParams[ paramName ] ) {

                        if ( shaderParams[ paramName ].hasOwnProperty( subParamName ) ) {

                            var subParamType = toType( shaderParams[ paramName ][ subParamName ] );
                            if ( subParamType === 'number' ||
                                subParamType === 'boolean' ||
                                subParamType === 'string' ) {

                                paramFolder.add( shaderParams[ paramName ], subParamName );

                            }
                        }
                    }
                }
            }
        }

    } );

    var reverseButton = document.getElementById('shaderStackReverse');

    reverseButton.onclick = function() {

        stack.reverse();
        updateEnabledShadersList();
        return false;

    };

    updateEnabledShadersList();

}



// update GUI shaders list view from stack
function updateEnabledShadersList() {

    var list = document.getElementById('shadersStackList');
    list.innerHTML = null;

    stack.passes.forEach(function(pass, index) {

        var item = document.createElement('li');
        item.appendChild(document.createTextNode(pass.name));

        if ( index < stack.passes.length - 1 ) {

            var buttonDown = document.createElement('a');
            buttonDown.href = '#';
            buttonDown.appendChild(document.createTextNode('down'));

            buttonDown.onclick = function() {

                stack.movePassToIndex(index, index + 1);
                updateEnabledShadersList();
                return false;

            };

            var buttonBottom = document.createElement('a');
            buttonBottom.href = '#';
            buttonBottom.appendChild(document.createTextNode('bottom'));

            buttonBottom.onclick = function() {

                stack.movePassToIndex(index, stack.passes.length - 1);
                updateEnabledShadersList();
                return false;

            };

            item.appendChild( buttonBottom );
            item.appendChild( buttonDown );

        }

        if ( index > 0 ) {

            var buttonUp = document.createElement('a');
            buttonUp.href = '#';
            buttonUp.appendChild(document.createTextNode('up'));

            buttonUp.onclick = function() {

                stack.movePassToIndex(index, index - 1);
                updateEnabledShadersList();
                return false;

            };

            var buttonTop = document.createElement('a');
            buttonTop.href = '#';
            buttonTop.appendChild(document.createTextNode('top'));

            buttonTop.onclick = function() {

                stack.movePassToIndex(index, 0);
                updateEnabledShadersList();
                return false;

            };

            item.appendChild( buttonUp );
            item.appendChild( buttonTop );
            
        }


        if ( !pass.enabled ) {

            item.className = 'disabled';

        }

        list.appendChild( item );

    });

}
