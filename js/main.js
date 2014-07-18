if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var renderer, scene, camera, stats;
var objects = [];


var WIDTH = window.innerWidth,
    HEIGHT = window.innerHeight;

var k = 0;
var points;
var spline;
var geometrySpline;
var splineObject;
var cubeObject;

var subdivisions = 6;
var recursion = 1;

init();
animate();

function updateSpline() {
    geometrySpline = new THREE.Geometry();

    for ( var i = 0; i < points.length * subdivisions; i ++ ) {

	var index = i / ( points.length * subdivisions );
	var position = spline.getPoint( index );

	geometrySpline.vertices[ i ] = new THREE.Vector3( position.x + k, position.y, position.z );

    }

    k++;
    if (k > 50) {
	k = 0;
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

    scene.add( cubeObject );

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

    splineObject.rotation.x = 0.25 * time;
    splineObject.rotation.y = 0.25 * time;
    cubeObject.rotation.x = 0.25 * time;
    cubeObject.rotation.y = 0.25 * time;
}

function render() {
    renderer.render( scene, camera );

}
