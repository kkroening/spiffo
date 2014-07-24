if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var renderer, scene, camera, stats;
var objects = [];

function Unimplemented() {
    throw new Error("Unimplemented method");
}


function Vector(size) {
    EventType.call(this);
    this.x = [];
    for (var i = 0; i < size; i++) {
        this.x[i] = 0.0;
    }
}


function Vector2() {
    Vector.call(this, 2);
}
Vector2.prototype = Vector.prototype;


function Vector3() {
    Vector.call(this, 3);
}
Vector3.prototype = Vector.prototype;


function Vector4() {
    Vector.call(this, 4);
}
Vector4.prototype = Vector.prototype;


function ComplexNumber() {
    Vector2.call(this);
}
ComplexNumber.prototype = Object.create(Vector2.prototype);

function newComplexNumber(re, im) {
    var x = new ComplexNumber();
    x.x[0] = re;
    x.x[1] = im;
}


function Sequence(eventType, size) {
    this.eventType = eventType;
    this.size = size;
    this.data = [];
    for (var i = 0; i < size; i++) {
        var foo = eventType.create();
        this.data[i] = eventType.create();
    }
}
Sequence.prototype = Object.create(EventType.prototype);


function EventType() {
}
EventType.prototype.create = Unimplemented;


function DummyEventType() {
    EventType.call(this);
}
DummyEventType.prototype = Object.create(EventType.prototype);


function NumberEventType() {
    EventType.call(this);
}
NumberEventType.prototype = Object.create(EventType.prototype);
NumberEventType.prototype.create = function() {
    return 0.0;
}


function VectorEventType(size) {
    EventType.call(this);
    this.size = size;
}
VectorEventType.prototype = Object.create(EventType.prototype);
VectorEventType.prototype.create = function() {
    return new Vector(this.size);
}


var vector2EventType = new VectorEventType(2);
var vector3EventType = new VectorEventType(3);
var vector4EventType = new VectorEventType(4);


function ComplexEventType() {
    EventType.call(this);
}
ComplexEventType.prototype = Object.create(EventType.prototype);
ComplexEventType.prototype.create = function() {
    return new ComplexNumber(0.0, 0.0);
}


function SequenceEventType(eventType, defaultSize) {
    EventType.call(this);
    this.eventType = eventType;
    this.defaultSize = defaultSize;
}
SequenceEventType.prototype = Object.create(EventType.prototype);
SequenceEventType.prototype.create = function() {
    return new Sequence(this.eventType, this.defaultSize);
}


function Port(name, eventType, isOutput) {
    this.name = name;
    this.eventType = eventType;
    this.isOutput = isOutput;
    this.owner = null;
    this.connections = [];
    if (isOutput) {
        this.event = eventType.create();
    } else {
        this.event = null;
    }
}
Port.prototype.connect = function(other) {
    for (var i = 0; i < this.connections.length; i++) {
        if (this.connections[i] == other) {
            return;
        }
    }
    if (this.isOutput) {
        if (other.isOutput) {
            throw new Error("Can't connect output port '" + this.name + "' to output port '" + other.name + "'");
        }
        other.event = this.event;
    } else {
        if (other.isInput) {
            throw new Error("Can't connect input port '" + this.name + "' to input port '" + other.name + "'");
        }
        this.event = other.event;
    }
    this.connections.push(other);
    other.connections.push(this);
}
Port.prototype.disconnect = function(other) {
    for (var i = 0; i < this.connections.length; i++) {
        if (this.connections[i] == other) {
            this.connections.splice(i, i);
            other.disconnect(this);
            if (!this.isOutput) {
                this.event = null;
            }
            break;
        }
    }
}
Port.prototype.disconnectAll = function() {
    var connections = this.connections;
    this.connections = [];
    for (var i = 0; i < this.connections.length; i++) {
        this.connections[i].disconnect(this);
    }
}
Port.prototype.setEvent = function(event) {
    if (!this.isOutput) { 
        throw new Error("Attempted to call setEvent on input port '" + this.name + "' (can only be called on output ports)");
    }
    this.event = event;
    for (var i = 0; i < this.connections.length; i++) {
        var connection = this.connections[i];
        connection.event = this.event;
    }
}


function Component(name) {
    this.name = name;
    this.ports = [];
}
Component.prototype.addPort = function(port) {
    if (port.owner) {
        throw new Error("Port '" + port.name + "' already has owner '" + port.owner.name + "'");
    }
    for (var i = 0; i < this.ports.length; i++) {
        var port2 = this.ports[i];
        if (port2 == port) {
            throw new Error("Component '" + this.name + "' already contains port '" + port.name + "'");
        }
    }
    port.owner = this;
    this.ports.push(port);
}
Component.prototype.run = Unimplemented;


var WIDTH = window.innerWidth,
    HEIGHT = window.innerHeight;

var k = 0;
var splineObject;
var signalObject;

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
    //  - speed - speed multiplier.
    //
    speed: 1.0,

    //
    //  - cycles - number of revolutions (for example, a sinusoid with a frequency
    //    of 1 and 3 cycles would produce 1*3 circles)
    //
    cycles: 3.0,

    //
    //  - resolution - samples per cycle: higher values correspond to smoother
    //    lines at the expense of CPU time.
    //
    resolution: 300,

    showSignal: false
};


function Generator(name) {
    Component.call(this, name);
    this.out = new Port("out", new SequenceEventType(vector3EventType, 10), true);
    Component.prototype.addPort.call(this, this.out);
}
Generator.prototype = Object.create(Component.prototype);
Generator.prototype.run = function(deltaTime) {
    var event = this.out.event;
    var length = Math.floor(params.cycles * params.resolution);
    if (event.data.length != length) {
        this.out.setEvent(new Sequence(vector3EventType, length));
        event = this.out.event;
    }
    for (var n = 0; n < length; n++) {
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
        event.data[n].x[0] = x1+x2+x3;
        event.data[n].x[1] = y1+y2+y3;
        event.data[n].x[2] = z;
    }
}


function Plotter(name) {
    Component.call(this, name);
    this.in = new Port("in", new SequenceEventType(vector3EventType, 10), false);
    Component.prototype.addPort.call(this, this.in);
}
Plotter.prototype = Object.create(Component.prototype);
Plotter.prototype.run = function(deltaTime) {
    if (splineObject != null) {
        scene.remove(splineObject);
        splineObject = null;
    }
    if (signalObject != null) {
        scene.remove(signalObject);
        signalObject = null;
    }

    if (this.in.event) {
        var geometrySpline = new THREE.Geometry();
        var geometrySignal;
        if (params.showSignal) {
            geometrySignal = new THREE.Geometry();
        }

        var length = this.in.event.data.length;
        var signalScaleX = 1 / (params.a1 + params.a2 + params.a3) * WIDTH/80;
        var signalScaleY = 1 / (length) * HEIGHT/6.5;

        for (var n = 0; n < length; n++) {
            var p = this.in.event.data[n];
            var x = p.x[0];
            var y = p.x[1];
            var z = p.x[2];
            geometrySpline.vertices[n] = new THREE.Vector3(x, y, z);

            if (params.showSignal && (n % 2) == 0) {
                geometrySignal.vertices[n/2] = new THREE.Vector3(-x*signalScaleX - WIDTH/14, -(n-length*0.5)*signalScaleY, 0);
            }
        }

        geometrySpline.computeLineDistances();
        splineObject = new THREE.Line( geometrySpline, new THREE.LineDashedMaterial( { color: 0xffffff, dashSize: 1, gapSize: 0.5 } ), THREE.LineStrip );
        scene.add(splineObject);

        if (params.showSignal) {
            geometrySignal.computeLineDistances();
            signalObject = new THREE.Line( geometrySignal, new THREE.LineDashedMaterial( { color: 0x7777ee, dashSize: 1, gapSize: 0.5 } ), THREE.LineStrip );
            scene.add(signalObject);
        }
    }
}


var generator = new Generator("generator");
var plotter = new Plotter("plotter");
generator.out.connect(plotter.in);


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

function runScheduler(deltaTime) {
    generator.run(deltaTime);
    plotter.run(deltaTime);
}

function init() {
    camera = new THREE.PerspectiveCamera( 60, WIDTH / HEIGHT, 1, 2000 );
    camera.position.z = 150;

    scene = new THREE.Scene();

    //scene.fog = new THREE.Fog( 0x111111, 170, 200 );

    root = new THREE.Object3D();

    runScheduler(0);

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
    gui.add(params, 'speed').min(-2).max(2);
    gui.add(params, 'resolution').min(10).max(2000);
    gui.add(params, 'showSignal');
}

function onWindowResize() {
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;

    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();

    renderer.setSize(WIDTH, HEIGHT);

}

function animate() {

    requestAnimationFrame( animate );

    update();
    render();
    stats.update();

}

function update() {
    var nextTime = Date.now();
    var realDeltaTime = (nextTime - lastTime)*0.001;
    var deltaTime = realDeltaTime * params.speed;
    lastTime = nextTime;

    runScheduler(deltaTime);
    updateParameters(deltaTime);

    k++;
    
    splineObject.rotation.x = 0.1*Math.cos(Math.PI*2*k/213);
    splineObject.rotation.y = 0.1*Math.sin(Math.PI*2*k/200);
}

function render() {
    renderer.render( scene, camera );

}
