if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
}


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
var numberEventType = new NumberEventType();


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
var complexEventType = new ComplexEventType();


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
    this.div = null;
    this.wirePath = null;
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
Port.prototype.getTerminalPosition = function(parent) {
    var offset = this.div.terminal.offset();
    offset.left += this.div.terminal.width()/2;
    offset.top += this.div.terminal.height()/2;    
    if (parent != null) {
        var parentOffset = parent.offset();
        offset.left -= parentOffset.left;
        offset.top -= parentOffset.top;
    }
    return { x: offset.left, y : offset.top };
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


var WIDTH, HEIGHT;

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

    showSignal: true
};

function GuiControl(name) {
    Component.call(this, name);
    this.out = new Port("out", numberEventType, true);
    Component.prototype.addPort.call(this, this.out);
}
GuiControl.prototype = Object.create(Component.prototype);
GuiControl.prototype.run = function(deltaTime) {
}


function Sinusoid(name) {
    Component.call(this, name);
    this.freq = new Port("freq", numberEventType, false);
    this.phase = new Port("phase", numberEventType, false);
    this.out = new Port("out", new SequenceEventType(vector2EventType, 10), true);
    Component.prototype.addPort.call(this, this.freq);
    Component.prototype.addPort.call(this, this.phase);
    Component.prototype.addPort.call(this, this.out);
}
Sinusoid.prototype = Object.create(Component.prototype);
Sinusoid.prototype.run = function(deltaTime) {
}

function Adder(name, numInputs, eventType) {
    Component.call(this, name);
    this.eventType = eventType;
    this.setNumInputs(numInputs);
    this.out = new Port("out", eventType, true);
    Component.prototype.addPort.call(this, this.out);
}
Adder.prototype.setNumInputs = function(numInputs) {
    // FIXME: allow setNumPorts to be called post-init.
    this.in = [];
    for (var i = 0; i < numInputs; i++) {
        this.in.push(new Port("in" + i, this.eventType, false));
        Component.prototype.addPort.call(this, this.in[i]);
    }
}
Adder.prototype.run = function(deltaTime) {
}

function Multiplier(name, numInputs, eventType) {
    Component.call(this, name);
    this.eventType = eventType;
    this.setNumInputs(numInputs);
    this.out = new Port("out", eventType, true);
    Component.prototype.addPort.call(this, this.out);
}
Multiplier.prototype.setNumInputs = function(numInputs) {
    // FIXME: allow setNumPorts to be called post-init.
    this.in = [];
    for (var i = 0; i < numInputs; i++) {
        this.in.push(new Port("in" + i, this.eventType, false));
        Component.prototype.addPort.call(this, this.in[i]);
    }
}
Multiplier.prototype.run = function(deltaTime) {
}

function Exponentiator(name, eventType) {
    Component.call(this, name);
    this.eventType = eventType;
    this.in = new Port("in", eventType, false);
    this.out = new Port("out", eventType, true);
    Component.prototype.addPort.call(this, this.in);
    Component.prototype.addPort.call(this, this.out);
}
Exponentiator.prototype.run = function(deltaTime) {
}


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
        mainRenderView.scene.remove(splineObject);
        splineObject = null;
    }
    if (signalObject != null) {
        signalRenderView.scene.remove(signalObject);
        signalObject = null;
    }

    if (this.in.event) {
        var geometrySpline = new THREE.Geometry();
        var geometrySignal;
        if (params.showSignal) {
            geometrySignal = new THREE.Geometry();
        }

        var length = this.in.event.data.length;
        var signalScaleY = 1 / (params.a1 + params.a2 + params.a3) * HEIGHT/10;

        for (var n = 0; n < length; n++) {
            var p = this.in.event.data[n];
            var x = p.x[0];
            var y = p.x[1];
            var z = p.x[2];
            geometrySpline.vertices[n] = new THREE.Vector3(x, y, z);

            if (params.showSignal && (n % 2) == 0) {
                geometrySignal.vertices[n/2] = new THREE.Vector3((n/length - 0.5) * WIDTH, -x * signalScaleY, 0);
            }
        }

        geometrySpline.computeLineDistances();
        splineObject = new THREE.Line( geometrySpline, new THREE.LineDashedMaterial( { color: 0xffffff, dashSize: 1, gapSize: 0.5 } ), THREE.LineStrip );
        mainRenderView.scene.add(splineObject);

        if (params.showSignal) {
            geometrySignal.computeLineDistances();
            signalObject = new THREE.Line( geometrySignal, new THREE.LineDashedMaterial( { color: 0x7777ee, dashSize: 1, gapSize: 0.5 } ), THREE.LineStrip );
            signalRenderView.scene.add(signalObject);
        }
    }
}

var spacing_per_sin = 50;

var components = [];

var generator = new Generator("generator");
components.push(generator);

var plotter = new Plotter("plotter");
generator.desiredPosition = { x: 100, y: 10 };
//plotter.desiredPosition = { x: 300, y: 10 };
components.push(plotter);


var control_a1 = new GuiControl("a1");
var control_a2 = new GuiControl("a2");
var control_a3 = new GuiControl("a3");
components.push(control_a1);
components.push(control_a2);
components.push(control_a3);

var control_c1 = new GuiControl("c1");
var control_c2 = new GuiControl("c2");
var control_c3 = new GuiControl("c3");
components.push(control_c1);
components.push(control_c2);
components.push(control_c3);

var control_p1 = new GuiControl("p1");
var control_p2 = new GuiControl("p2");
var control_p3 = new GuiControl("p3");
control_p1.desiredPosition = { x: 20, y: 50 };
control_p2.desiredPosition = { x: 20, y: 50 + spacing_per_sin };
control_p3.desiredPosition = { x: 20, y: 50 + spacing_per_sin*2 };
components.push(control_p1);
components.push(control_p2);
components.push(control_p3);

var multiplier1 = new Multiplier("mult", 3, new SequenceEventType(vector2EventType, 10));
var multiplier2 = new Multiplier("mult", 3, new SequenceEventType(vector2EventType, 10));
var multiplier3 = new Multiplier("mult", 3, new SequenceEventType(vector2EventType, 10));
components.push(multiplier1);
components.push(multiplier2);
components.push(multiplier3);

var adder = new Adder("add", 3, new SequenceEventType(vector2EventType, 10));
components.push(adder);

var sin1 = new Sinusoid("sin1");
var sin2 = new Sinusoid("sin2");
var sin3 = new Sinusoid("sin3");
components.push(sin1);
components.push(sin2);
components.push(sin3);

var exp1 = new Exponentiator("exp", new SequenceEventType(vector2EventType, 10));
var exp2 = new Exponentiator("exp", new SequenceEventType(vector2EventType, 10));
var exp3 = new Exponentiator("exp", new SequenceEventType(vector2EventType, 10));
components.push(exp1);
components.push(exp2);
components.push(exp3);

control_a1.out.connect(multiplier1.in[0]);
control_a2.out.connect(multiplier2.in[0]);
control_a3.out.connect(multiplier3.in[0]);

control_p1.out.connect(sin1.phase);
control_p2.out.connect(sin2.phase);
control_p3.out.connect(sin3.phase);

exp1.out.connect(multiplier1.in[1])
exp2.out.connect(multiplier2.in[1])
exp3.out.connect(multiplier3.in[1])

sin1.out.connect(multiplier1.in[2]);
sin2.out.connect(multiplier2.in[2]);
sin3.out.connect(multiplier3.in[2]);

multiplier1.out.connect(adder.in[0]);
multiplier2.out.connect(adder.in[1]);
multiplier3.out.connect(adder.in[2]);

generator.out.connect(plotter.in);


$(document).ready(function() {
    init();
    //animate();
});


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

function MainRenderView() {
    View.call(this, -1, -1);
    this.camera = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 1, 2000);
    this.camera.position.z = 150;
    this.scene = new THREE.Scene();
    //this.scene.fog = new THREE.Fog( 0x111111, 170, 200 );
    this.root = new THREE.Object3D();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setClearColor(0x111111, 1);
    this.renderer.setSize(WIDTH, HEIGHT);
    this.div.append(this.renderer.domElement);
    this.stats = new Stats();
    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.top = '0px';
    this.div.append(this.stats.domElement);
}

MainRenderView.prototype = Object.create(View.prototype);
MainRenderView.prototype.constructor = MainRenderView;

MainRenderView.prototype.setSize = function(width, height) {
    View.prototype.setSize.call(this, width, height);
    WIDTH = width;
    HEIGHT = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
}

MainRenderView.prototype.render = function() {
    this.renderer.render(this.scene, this.camera);
}

var mainRenderView;


function SignalRenderView() {
    View.call(this, -1, 200);
    this.camera = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 1, 2000);
    this.camera.position.z = 150;
    this.scene = new THREE.Scene();
    //this.scene.fog = new THREE.Fog( 0x111111, 170, 200 );
    this.root = new THREE.Object3D();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setClearColor(0x111111, 1);
    this.renderer.setSize(WIDTH, HEIGHT);
    this.div.append(this.renderer.domElement);
}

SignalRenderView.prototype = Object.create(View.prototype);
SignalRenderView.prototype.constructor = SignalRenderView;

SignalRenderView.prototype.setSize = function(width, height) {
    View.prototype.setSize.call(this, width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
}

SignalRenderView.prototype.render = function() {
    this.renderer.render(this.scene, this.camera);
}


var signalRenderView;


var circlez;

function ComponentView() {
    View.call(this, -1, -1);
    this.div.addClass('component-view');
    this.div.selectable();
    this.initialized = false;
    this.desiredPosition = undefined;
    $('<h2 style="text-align: center">' + "Component view" + '</h2>').appendTo(this.div);
}

ComponentView.prototype = Object.create(View.prototype);
ComponentView.prototype.constructor = ComponentView;

ComponentView.prototype.setSize = function(width, height) {
    View.prototype.setSize.call(this, width, height);
    if (!this.initialized) {
        this.init();
    } else {
	this.updateAllWiring();
    }
}

ComponentView.prototype.init = function() {
    var componentViewOffset = this.div.offset();

    this.svg = $('<svg class="component-view-overlay"></svg>');
    this.svg.appendTo(this.div);
    this.d3svg = d3.select(this.svg.get(0));

    //
    // Create components and ports.
    //

    for (var i = 0; i < components.length; i++) {
        var c = components[i];
        c.div = mkdiv("component-" + c.name, "component", this.div);
	if (c.desiredPosition) {
	    console.log(c.name);
	    c.div.css("position", "absolute");
	    console.log(c.div.position());
	    c.div.offset({ left: c.desiredPosition.x + componentViewOffset.left, top: c.desiredPosition.y + componentViewOffset.top });
	    console.log(c.div.position());
	}
        c.div.get(0).component = c;
        for (var j = 0; j < c.ports.length; j++) {
            var p = c.ports[j];
            if (p.isOutput) {
                if (c.outputPortsDiv == null) {
                    c.outputPortsDiv = mkdiv("outputs-" + c.name, "component-outputs", c.div);
                }
                p.div = mkdiv("component-" + c.name + "-port-" + p.name, "output-port", c.outputPortsDiv);
                p.div.terminal = mkdiv("component-" + c.name + "-port-" + p.name + "-terminal", "output-terminal", p.div);
                p.div.label = $("<h5 class=\"output-port-label\">" + p.name + "</h5>");
            } else {
                if (c.inputPortsDiv == null) {
                    c.inputPortsDiv = mkdiv("inputs-" + c.name, "component-inputs", c.div);
                }
                p.div = mkdiv("component-" + c.name + "-port-" + p.name, "input-port", c.inputPortsDiv);
                p.div.terminal = mkdiv("component-" + c.name + "-port-" + p.name + "-terminal", "input-terminal", p.div);
                p.div.label = $("<h5 class=\"input-port-label\">" + p.name + "</h5>");
            }
            p.div.label.appendTo(p.div);
        }
        var that = this;
        c.div.draggable({
            drag: function(event, ui) {
                var component = ui.helper.get(0).component;
                for (var j = 0; j < component.ports.length; j++) {
                    var p = component.ports[j];
                    if (p.isOutput) {
                        for (var k = 0; k < p.connections.length; k++) {
                            var p2 = p.connections[k];
                            that.updateWiring(p2, p);
                        }
                    } else if (p.connections.length != 0) {
                        that.updateWiring(p, p.connections[0]);
                    }
                }
            }
        });
        c.labelBox = $("<h4 class=\"component-label\">" + c.name + "</h4>");
        c.labelBox.appendTo(c.div);
    }

    this.updateAllWiring();
    this.initialized = true;
}
ComponentView.prototype.updateAllWiring = function() {
    for (var i = 0; i < components.length; i++) {
        var c = components[i];
        for (var j = 0; j < c.ports.length; j++) {
            var p = c.ports[j];
            if (p.isOutput) {
                for (k = 0; k < p.connections.length; k++) {
                    this.updateWiring(p.connections[k], p);
                }
            }
        }
    }
}
ComponentView.prototype.updateWiring = function(inputPort, outputPort) {
    var pos1 = outputPort.getTerminalPosition(this.div);
    var pos1b = { x: pos1.x + 60, y: pos1.y };
    var pos2 = inputPort.getTerminalPosition(this.div);
    var pos2b = { x: pos2.x - 60, y: pos2.y };
    if (inputPort.wirePath == null) {
        inputPort.wirePath = this.d3svg.append("path").classed("wire", true);
    }
    inputPort.wirePath.attr("d", "M" + pos1.x + "," + pos1.y + " C" + pos1b.x + "," + pos1b.y + " " + pos2b.x + "," + pos2b.y + " " + pos2.x + "," + pos2.y);
}

var componentView;


function DatView(width, height) {
    View.call(this, width, height);

    var gui = new dat.GUI({ autoPlace: false, resizable: false, hideable: false});
    this.gui = gui;
    this.div.append(gui.domElement);

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
    //gui.add(params, 'showSignal');
}

DatView.prototype = Object.create(View.prototype);
DatView.prototype.constructor = DatView;

DatView.prototype.setSize = function(width, height) {
    View.prototype.setSize.call(this, width, height);
    this.gui.width = width;
}

var datView;


function init() {
    //mainRenderView = new MainRenderView();
    //signalRenderView = new SignalRenderView();
    componentView = new ComponentView();

    //topLevelView.setCenter(mainRenderView);
    //topLevelView.setBottom(signalRenderView);

    topLevelView.setCenter(componentView);

    datView = new DatView(300, -1);
    topLevelView.setRight(datView);
}

var renderMode = false;

function animate() {
    requestAnimationFrame(animate);

    update();

    if (renderMode) {
        mainRenderView.render();
        signalRenderView.render();
        mainRenderView.stats.update();
    }
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
