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

    stack = new WAGNER.Stack( new WAGNER.ShadersPool() );

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
        model.rotation.y += .0005;

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

function toType( obj ) {
    return ( {} ).toString.call( obj ).match( /\s([a-zA-Z]+)/ )[ 1 ].toLowerCase()
}







var Editor = ( function () {

    var $addShaderInput = $( '#add-shader-input' ),
        $addShaderButton = $( '#add-shader-button' ),
        $shadersList = $( '#shaders-list' ),
        sortable;

    function init() {

        shaders = [ 'InvertPass', 'FXAAPass', 'SSAOPass', 'SepiaPass', 'BoxBlurPass', 'FullBoxBlurPass', 'ZoomBlurPass', 'MultiPassBloomPass', 'DenoisePass', 'CGAPass', 'SobelEdgeDetectionPass', 'BlendPass', 'GuidedBoxBlurPass', 'GuidedFullBoxBlurPass', 'PixelatePass', 'RGBSplitPass', 'ChromaticAberrationPass', 'BarrelBlurPass', 'OldVideoPass', 'DotScreenPass', 'CircularBlurPass', 'PoissonDiscBlurPass', 'VignettePass', 'Vignette2Pass', 'FreiChenEdgeDetectionPass', 'ToonPass', 'HighPassPass', 'GrayscalePass', 'ASCIIPass', 'LEDPass', 'HalftonePass', 'DirtPass', 'NoisePass' ];

        shaders.forEach( function ( shaderName ) {

            $addShaderInput.append( '<option value="' + shaderName + '">' + shaderName + '</option>' );

        } );

        $addShaderButton.on( 'click', function () {

            var newShaderName = $addShaderInput.val();

            stack.addPass( newShaderName, true )

            updateEnabledShadersList();

        } );

        var sortable = Sortable.create( $shadersList[ 0 ], {
            animation: 150,
            // handle: ".shader-name", 
            onEnd: function ( event ) {
                stack.movePassToIndex( event.oldIndex, event.newIndex );
                updateEnabledShadersList();
            }
        } );

    }

    function updateEnabledShadersList() {

        var $shaderItem,
            $shaderControls,
            $shaderParams;

        $shadersList.empty();

        if ( stack.passItems ) {

            stack.passItems.forEach( function ( passItem, index ) {

                $shaderItem = $( '<li class="shader"><span class="shader-name"><i class="fa fa-angle-right"></i>' + passItem.shaderName + '</span><div class="shader-controls"></div><ul class="shader-params"></ul></li>' );
                $shaderControls = $shaderItem.find( '.shader-controls' );
                $shaderParams = $shaderItem.find( '.shader-params' );

                if ( index < stack.passItems.length - 1 ) {

                    var buttonDown = $( '<a href="#"><i class="fa fa-angle-down"></i></a>' );

                    buttonDown.on( 'click', function () {

                        stack.movePassToIndex( index, index + 1 );
                        updateEnabledShadersList();
                        return false;

                    } );

                    var buttonBottom = $( '<a href="#"><i class="fa fa-angle-double-down"></i></a>' );

                    buttonBottom.on( 'click', function () {

                        stack.movePassToIndex( index, stack.passItems.length - 1 );
                        updateEnabledShadersList();
                        return false;

                    } );

                    $shaderControls.append( buttonBottom );
                    $shaderControls.append( buttonDown );

                }

                if ( index > 0 ) {

                    var buttonTop = $( '<a href="#"><i class="fa fa-angle-double-up"></a>' );

                    buttonTop.on( 'click', function () {

                        stack.movePassToIndex( index, 0 );
                        updateEnabledShadersList();
                        return false;

                    } );

                    var buttonUp = $( '<a href="#"><i class="fa fa-angle-up"></i></a>' );

                    buttonUp.on( 'click', function () {

                        stack.movePassToIndex( index, index - 1 );
                        updateEnabledShadersList();
                        return false;

                    } );

                    $shaderControls.append( buttonUp );
                    $shaderControls.append( buttonTop );

                }

                var buttonDelete = $( '<a href="#"><i class="fa fa-trash"></i></a>' );

                buttonDelete.on( 'click', function () {

                    stack.removePass( index );
                    updateEnabledShadersList();
                    return false;

                } );

                $shaderControls.append( buttonDelete );


                if ( !passItem.enabled ) {

                    $shaderItem.addClass = 'disabled';

                }

                addShaderParamsInputs( passItem.shaderName, $shaderParams );

                $shadersList.append( $shaderItem );

            } );
        }
    }

    function addShaderParamsInputs( shaderName, $shaderParams ) {

        var shader = new WAGNER[ shaderName ]();

        if ( shader && shader.params ) {

            console.log( shader.params );
            addParamsInputs( shader.params, $shaderParams );

        }
    }

    function addParamsInputs( params, $parent ) {

        var $shaderParamItem;

        for ( var paramName in params ) {

            if ( params.hasOwnProperty( paramName ) ) {

                var paramType = toType( params[ paramName ] );

                if ( paramType === 'number' ||
                    paramType === 'boolean' ||
                    paramType === 'string' ) {

                    $shaderParamItem = $( '<li class="shader-param" data-param="' + paramName + '"><div class="shader-param-name">' + paramName + '</div><input class="shader-param-value param-value-' + paramType + '" value="' + params[ paramName ] + '"/></li>' );
                    $parent.append( $shaderParamItem );

                    $shaderParamItem.on( 'input', 'input.shader-param-value', function ( event ) {

                        var passIndex = $( this ).closest( '.shader' ).index(),
                            rootParam,
                            editedParamName = $( this ).closest( '.shader-param' ).data( 'param' ),
                            parentParamName = $( this ).closest( '.shader-param-parent' ).data( 'param' ),
                            paramValue = $( this ).hasClass('param-value-boolean') ? ($( this )[ 0 ].value === 'true') : $( this )[ 0 ].value;

                        console.log('paramType', paramType);

                        // console.log( 'parentParamName', parentParamName );
                        // console.log('editing', editedParamName, $(this)[0].value, stack.passItems[passIndex]);
                        rootParam = stack.passItems[ passIndex ].params;

                        // get parent param if edited param in not on root of params object
                        if ( parentParamName && rootParam[ parentParamName ] ) {

                            rootParam = rootParam[ parentParamName ];
                            console.log( 'params[' + parentParamName + '][' + editedParamName + '] = ' );

                        } else {

                            console.log( 'params[' + editedParamName + '] = ' );

                        }

                        rootParam[ editedParamName ] = paramValue;
                        console.log( rootParam[ editedParamName ] );

                        stack.updatePasses();

                    } );

                    if (paramType === 'boolean') {

                        $shaderParamItem.find('input.shader-param-value.param-value-boolean').prop('readonly', true);;

                        $shaderParamItem.on( 'click', 'input.shader-param-value.param-value-boolean', function ( event ) {

                            if ( $( this ).val() === 'true' ) {

                                $( this ).val('false').trigger( 'input' );

                            } else {

                                $( this ).val('true').trigger( 'input' );

                            }

                        } );

                    }

                } else if ( paramType === 'object' ) {

                    var $containerParam = $parent.append( '<li class="shader-param shader-param-parent" data-param="' + paramName + '"><div class="shader-param-name">' + paramName + '</div><ul class="shader-params"></ul></li>' ).find( 'ul' );

                    console.log( 'subparam', paramName )
                    addParamsInputs( params[ paramName ], $containerParam );
                }
            }
        }

    }

    return {
        init: init
    };

} )();

$( function () {
    Editor.init();
} );
