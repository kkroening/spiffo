if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var renderer, scene, camera, stats;
var objects = [];


var WIDTH = window.innerWidth,
    HEIGHT = window.innerHeight;

var a1 = 500;
var a2 = 220;
var c1 = 0.11;
var c2 = 0.06;
var w1 = 3.0;
var w2 = -4.25;
var p1 = 0;
var p2 = 0;
var max_cycles1 = 3;
var max_cycles2 = 3;

var samples_per_1hz_cycle = 300;

var k = 0;
var cycles = max_cycles1;
var geometrySpline;
var splineObject;
var cubeObject;

var lastTime = Date.now();


var recursion = 1;

init();
animate();

function updateSpline(deltaTime) {
    geometrySpline = new THREE.Geometry();

    for ( var n = 0; n < cycles * samples_per_1hz_cycle; n++) {
	var i = n / samples_per_1hz_cycle;
        var x = (a1 * Math.pow(c1, i) * Math.cos(Math.PI*2*(i*w1 + p1))) + (a2 * Math.pow(c2, i) * Math.cos(Math.PI*2*(i*w2 + p2)));
        var y = (a1 * Math.pow(c1, i) * Math.sin(Math.PI*2*(i*w1 + p1))) + (a2 * Math.pow(c2, i) * Math.sin(Math.PI*2*(i*w2 + p2)));
        var z = -20*i + 30;
        geometrySpline.vertices[n] = new THREE.Vector3(x, y, z);
    }

    cycles += 5*deltaTime;
    if (cycles > max_cycles2) {
        cycles = max_cycles1;
    }

    w1 += 0.8*deltaTime;
    if (w1 > 10) {
	w1 = -10;
    }

    w2 -= 0.69*deltaTime;
    if (w2 > 10) {
	w2 = -10;
    }

    //p1 += 0.05*deltaTime + 0.2*math.sin(Math.PI*2*k * 0.1);
    //p1 += 0.2*Math.sin(math.PI*2*k * 0.1);
    p2 -= 0.0132*deltaTime;

    geometrySpline.computeLineDistances();

    if (splineObject != null) {
        scene.remove(splineObject);
    }

    splineObject = new THREE.Line( geometrySpline, new THREE.LineDashedMaterial( { color: 0xffffff, dashSize: 1, gapSize: 0.5 } ), THREE.LineStrip );

    scene.add( splineObject );
}

function init() {

    camera = new THREE.PerspectiveCamera( 60, WIDTH / HEIGHT, 1, 2000 );
    camera.position.z = 150;

    scene = new THREE.Scene();

    //scene.fog = new THREE.Fog( 0x111111, 170, 200 );

    root = new THREE.Object3D();

    var geometryCube = cube( 50 );

    updateSpline(0);

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
    var nextTime = Date.now();
    var deltaTime = (nextTime - lastTime)*0.001;
    lastTime = nextTime;

    updateSpline(deltaTime);

    k++;
    
    splineObject.rotation.x = 0.1*Math.cos(Math.PI*2*k/113);
    splineObject.rotation.y = 0.1*Math.sin(Math.PI*2*k/100);
    cubeObject.rotation.x = 0.0025 * nextTime;
    cubeObject.rotation.y = 0.0025 * nextTime;
}

function render() {
    renderer.render( scene, camera );

}
