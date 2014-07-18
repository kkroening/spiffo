﻿if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var renderer, scene, camera, stats;
var objects = [];


var WIDTH = window.innerWidth,
    HEIGHT = window.innerHeight;

var a1 = 24;
var a2 = 8;
var c1 = 1;
var c2 = 1;
//var c1 = 0.15;
//var c2 = 0.06;
var w1 = 1;
var w2 = -2.1;
var p1 = 0;
var p2 = 0;
var nmax1 = 100;
var nmax2 = 500;

var samples_per_1hz_cycle = 60;

var k = 0;
var points;
var spline;
var geometrySpline;
var splineObject;
var cubeObject;


var recursion = 1;

init();
animate();

function updateSpline() {
    geometrySpline = new THREE.Geometry();

    for ( var i = 0; i < k; i++) {
	var theta = i * 360 / samples_per_1hz_cycle;
	var x = (a1 * Math.pow(c1, i) * Math.cos(theta*w1 + p1)) + (a2 * Math.pow(c2, i) * Math.cos(theta*w2 + p2));
	var y = (a1 * Math.pow(c1, i) * Math.sin(theta*w1 + p1)) + (a2 * Math.pow(c2, i) * Math.sin(theta*w2 + p2));
	geometrySpline.vertices[i] = new THREE.Vector3(x, y, 0);
    }

    k++;
    if (k > nmax2) {
	k = nmax1;
    }

    geometrySpline.computeLineDistances();

    if (splineObject != null) {
	scene.remove(splineObject);
    }

    splineObject = new THREE.Line( geometrySpline, new THREE.LineDashedMaterial( { color: 0xffffff, dashSize: 1, gapSize: 0.5 } ), THREE.LineStrip );

    scene.add( splineObject );
}

function init() {

    camera = new THREE.PerspectiveCamera( 60, WIDTH / HEIGHT, 1, 200 );
    camera.position.z = 150;

    scene = new THREE.Scene();

    scene.fog = new THREE.Fog( 0x111111, 150, 200 );

    root = new THREE.Object3D();

    var geometryCube = cube( 50 );

    points = hilbert3D( new THREE.Vector3( 0,0,0 ), 25.0, recursion, 0, 1, 2, 3, 4, 5, 6, 7 );
    spline = new THREE.Spline( points );
    updateSpline();

    geometryCube.computeLineDistances();

    cubeObject = new THREE.Line( geometryCube, new THREE.LineDashedMaterial( { color: 0xffaa00, dashSize: 3, gapSize: 1, linewidth: 2 } ), THREE.LinePieces );

    //scene.add( cubeObject );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setClearColor( 0x111111, 1 );
    renderer.setSize( WIDTH, HEIGHT );

    var container = document.getElementById( 'container' );
    container.appendChild( renderer.domElement );

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild( stats.domElement );

    //

    window.addEventListener( 'resize', onWindowResize, false );

}

function cube( size ) {

    var h = size * 0.5;

    var geometry = new THREE.Geometry();

    geometry.vertices.push(
	new THREE.Vector3( -h, -h, -h ),
	new THREE.Vector3( -h, h, -h ),

	new THREE.Vector3( -h, h, -h ),
	new THREE.Vector3( h, h, -h ),

	new THREE.Vector3( h, h, -h ),
	new THREE.Vector3( h, -h, -h ),

	new THREE.Vector3( h, -h, -h ),
	new THREE.Vector3( -h, -h, -h ),


	new THREE.Vector3( -h, -h, h ),
	new THREE.Vector3( -h, h, h ),

	new THREE.Vector3( -h, h, h ),
	new THREE.Vector3( h, h, h ),

	new THREE.Vector3( h, h, h ),
	new THREE.Vector3( h, -h, h ),

	new THREE.Vector3( h, -h, h ),
	new THREE.Vector3( -h, -h, h ),

	new THREE.Vector3( -h, -h, -h ),
	new THREE.Vector3( -h, -h, h ),

	new THREE.Vector3( -h, h, -h ),
	new THREE.Vector3( -h, h, h ),

	new THREE.Vector3( h, h, -h ),
	new THREE.Vector3( h, h, h ),

	new THREE.Vector3( h, -h, -h ),
	new THREE.Vector3( h, -h, h )
     );

    return geometry;

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );

    update();
    render();
    stats.update();

}

function update() {
    var time = Date.now() * 0.001;

    updateSpline();

    /*
    splineObject.rotation.x = 0.25 * time;
    splineObject.rotation.y = 0.25 * time;
    cubeObject.rotation.x = 0.25 * time;
    cubeObject.rotation.y = 0.25 * time;
    */
}

function render() {
    renderer.render( scene, camera );

}
