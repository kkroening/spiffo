if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var renderer, scene, camera, stats;
var objects = [];


var WIDTH = window.innerWidth,
    HEIGHT = window.innerHeight;

var k = 0;
var geometrySpline;
var splineObject;

var lastTime = Date.now();



//
// PARAMETERS:
//
//  - a1,a2 - amplitude: Higher values equal bigger waves.
//
var a1 = 500;
var a2 = 220;

//
//  - c1,c2 - decay. Values closer to 0 cause the sinusoid(s) to more quickly
//    decay.
//
var c1 = 0.21;
var c2 = 0.26;

//
//  - w1,w2 - frequency: higher absolute values cause the sinusoid(s) to vary
//    more quickly; values can be positive or negative.
//
var w1 = 3.0;
var w2 = -4.25;

//
//  - dw1,dw2 - rate of change for frequency parameters w1,w2.
//
var dw1 = 0.5;
var dw2 = -0.43;

//
//  - p1,p2 - phase.
//
var p1 = 0;
var p2 = 0;

//
//  - dp1,dp2 - rate of change for phase parameters.
//
var dp1 = 0;
var dp2 = 0.0132;

//
//  - cycles - number of revolutions (for example, a sinusoid with a frequency
//    of 1 and 3 cycles would produce 1*3 circles)
//
var cycles = 3;

//
//  - samples_per_cycle - resolution: higher values correspond to smoother
//    lines at the expense of CPU time.
//
var samples_per_cycle = 300;



init();
animate();

//
// updateParameters: called after each frame to continuously update the main
// parameters.
//
function updateParameters(deltaTime) {
    w1 += dw1*deltaTime;
    if (w1 > 10) {
	w1 = -10;
    }

    w2 -= dw2*deltaTime;
    if (w2 > 10) {
	w2 = -10;
    }

    //p1 += 0.05*deltaTime + 0.2*math.sin(Math.PI*2*k * 0.1);
    //p1 += 0.2*Math.sin(math.PI*2*k * 0.1);
    p1 += dp1*deltaTime;
    p2 += dp2*deltaTime;
}

function updateSpline(deltaTime) {
    geometrySpline = new THREE.Geometry();

    for ( var n = 0; n < cycles * samples_per_cycle; n++) {
	var i = n / samples_per_cycle;
        var x = (a1 * Math.pow(c1, i) * Math.cos(Math.PI*2*(i*w1 + p1))) + (a2 * Math.pow(c2, i) * Math.cos(Math.PI*2*(i*w2 + p2)));
        var y = (a1 * Math.pow(c1, i) * Math.sin(Math.PI*2*(i*w1 + p1))) + (a2 * Math.pow(c2, i) * Math.sin(Math.PI*2*(i*w2 + p2)));
        var z = -20*i + 30;
        geometrySpline.vertices[n] = new THREE.Vector3(x, y, z);
    }

    geometrySpline.computeLineDistances();

    if (splineObject != null) {
        scene.remove(splineObject);
    }

    splineObject = new THREE.Line( geometrySpline, new THREE.LineDashedMaterial( { color: 0xffffff, dashSize: 1, gapSize: 0.5 } ), THREE.LineStrip );

    scene.add( splineObject );

    updateParameters(deltaTime);
}

function init() {

    camera = new THREE.PerspectiveCamera( 60, WIDTH / HEIGHT, 1, 2000 );
    camera.position.z = 150;

    scene = new THREE.Scene();

    //scene.fog = new THREE.Fog( 0x111111, 170, 200 );

    root = new THREE.Object3D();

    updateSpline(0);

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
}

function render() {
    renderer.render( scene, camera );

}
