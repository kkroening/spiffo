if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var renderer, scene, camera, stats;
var objects = [];


var WIDTH = window.innerWidth,
    HEIGHT = window.innerHeight;

var k = 0;
var geometrySpline;
var splineObject;

var lastTime = Date.now();


var params = {
    //  - a1,a2 - amplitude; higher values equal bigger waves.
    //
    a1: 500,
    a2: 220,
    a3: 0,

    //
    //  - c1,c2 - decay; values closer to 0 cause the sinusoid(s) to more quickly
    //    decay.
    //
    c1: 0.11,
    c2: 0.06,
    c3: 0.12,

    //
    //  - w1,w2 - frequency: higher absolute values cause the sinusoid(s) to vary
    //    more quickly; values can be positive or negative.
    //
    w1: 3,
    w2: -4.25,
    w3: 1,

    //
    //  - dw1,dw2 - rate of change for frequency parameters w1,w2.
    //
    dw1: 0.8,
    dw2: -0.069,
    dw3: -1,

    //
    //  - max_freq - maximum frequency.
    //
    max_freq: 12,

    //
    //  - p1,p2 - phase.
    //
    p1: 0.0,
    p2: 0.0,
    p3: 0.0,

    //
    //  - dp1,dp2 - rate of change for phase parameters.
    //
    dp1: 0,
    dp2: -0.0132,
    dp3: 0,

    //
    //  - depth - scale of z coordinates.
    //
    depth: 150,

    //
    //  - cycles - number of revolutions (for example, a sinusoid with a frequency
    //    of 1 and 3 cycles would produce 1*3 circles)
    //
    cycles: 3.0,

    //
    //  - resolution - samples per cycle: higher values correspond to smoother
    //    lines at the expense of CPU time.
    //
    resolution: 300
};


init();
animate();

//
// updateParameters: called after each frame to continuously update the main
// parameters.
//
function updateParameters(deltaTime) {
    params.w1 += params.dw1*deltaTime;
    if (params.w1 > params.max_freq) {
	params.w1 = -params.max_freq;
    } else if (params.w1 < -params.max_freq) {
	params.w1 = params.max_freq;
    }

    params.w2 += params.dw2*deltaTime;
    if (params.w2 > params.max_freq) {
	params.w2 = -params.max_freq;
    } else if (params.w2 < -params.max_freq) {
	params.w2 = params.max_freq;
    }

    params.w3 += params.dw3*deltaTime;
    if (params.w3 > params.max_freq) {
	params.w3 = -params.max_freq;
    } else if (params.w3 < -params.max_freq) {
	params.w3 = params.max_freq;
    }

    params.p1 += params.dp1 * deltaTime;
    params.p2 += params.dp2 * deltaTime;
    params.p3 += params.dp3 * deltaTime;
}

function updateSpline(deltaTime) {
    geometrySpline = new THREE.Geometry();

    for ( var n = 0; n < params.cycles * params.resolution; n++) {
	var i = n / params.resolution;
        var pow1 = Math.pow(params.c1, i);
        var pow2 = Math.pow(params.c2, i);
        var pow3 = Math.pow(params.c3, i);
        var x1 = params.a1 * pow1 * Math.cos(Math.PI*2*(i*params.w1 + params.p1));
        var x2 = params.a2 * pow2 * Math.cos(Math.PI*2*(i*params.w2 + params.p2));
        var x3 = params.a3 * pow3 * Math.cos(Math.PI*2*(i*params.w3 + params.p3));
        var y1 = params.a1 * pow1 * Math.sin(Math.PI*2*(i*params.w1 + params.p1));
        var y2 = params.a2 * pow2 * Math.sin(Math.PI*2*(i*params.w2 + params.p2));
        var y3 = params.a3 * pow3 * Math.sin(Math.PI*2*(i*params.w3 + params.p3));
        var z = -params.depth*i + 30;
        geometrySpline.vertices[n] = new THREE.Vector3(x1+x2+x3, y1+y2+y3, z);
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

    var gui = new dat.GUI();
    gui.add(params, 'a1').min(0).max(1000);
    gui.add(params, 'a2').min(0).max(1000);
    gui.add(params, 'a3').min(0).max(1000);
    gui.add(params, 'c1').min(0.01).max(1);
    gui.add(params, 'c2').min(0.01).max(1);
    gui.add(params, 'c3').min(0.01).max(1);
    //gui.add(params, 'w1').min(-10).max(10);
    //gui.add(params, 'w2').min(-10).max(10);
    gui.add(params, 'dw1').min(-5).max(5);
    gui.add(params, 'dw2').min(-5).max(5);
    gui.add(params, 'dw3').min(-5).max(5);
    gui.add(params, 'max_freq').min(10).max(100);
    gui.add(params, 'p1').min(0).max(1);
    gui.add(params, 'p2').min(0).max(1);
    gui.add(params, 'p3').min(0).max(1);
    gui.add(params, 'dp1').min(-10).max(10);
    gui.add(params, 'dp2').min(-10).max(10);
    gui.add(params, 'dp3').min(-10).max(10);
    gui.add(params, 'depth').min(0).max(1000);
    gui.add(params, 'cycles').min(0).max(5);
    gui.add(params, 'resolution').min(10).max(2000);
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
    
    splineObject.rotation.x = 0.1*Math.cos(Math.PI*2*k/213);
    splineObject.rotation.y = 0.1*Math.sin(Math.PI*2*k/200);
}

function render() {
    renderer.render( scene, camera );

}
