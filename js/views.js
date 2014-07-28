function View(width, height) {
    this.width  = width;
    this.height = height;
    this.div    = $('<div class="view"></div>');
    //this.div.attr('id', 'inner');
    this.div.css("position", "absolute");
    this.div.css("width", "100%");
    this.div.css("height", "100%");
}

View.prototype.setSize = function(width, height) {
    this.width = width;
    this.height = height;
}


function EmptyView(width, height) {
    View.call(this, width, height);
    //this.div.selectable();
}

EmptyView.prototype = Object.create(View.prototype);
EmptyView.prototype.constructor = EmptyView;

EmptyView.prototype.setSize = function(width, height) {
    View.prototype.setSize.call(this, width, height);
}


function TestView(width, height, name) {
    View.call(this, width, height);

    $('<h2 style="text-align: center">' + name + '</h2>').appendTo(this.div);
    this.sizeText = $('<p style="text-align: center">abc</p>');
    this.sizeText.appendTo(this.div);
    this.updateSizeText();
}

TestView.prototype = Object.create(View.prototype);
TestView.prototype.constructor = TestView;

TestView.prototype.setSize = function(width, height) {
    View.prototype.setSize.call(this, width, height);
    this.updateSizeText();
}

TestView.prototype.updateSizeText = function() {
    this.sizeText.text(Math.round(this.width) + "x" + Math.round(this.height));
}

var mkdiv = function(id, cls, owner) {
    var result = $('<div class="' + cls + '"></div>').appendTo(owner);
    if (id != null && id !== "") {
        result.attr('id', id);
    }
    return result;
}

function TopLevelView(container) {
    View.call(this, 0, 0);

    this.div.addClass("tlv");

    //this.div.resize(this.doResize);

    // TODO: make this configurable.
    //this.extraLargeRightView = true;
    this.extraLargeRightView = false;

    this.div.css("position", "relative");
    this.div.css("width", "100%");
    this.div.css("height", "100%");

    this.subViews = [];
    this.subDivs  = [];

    var center = mkdiv("", "view-container tlv-center background3", this.div);
    var right  = mkdiv("", "view-container tlv-right background3", this.div);
    var bottom = mkdiv("", "view-container tlv-bottom background3", this.div);
    var left   = mkdiv("", "view-container tlv-left background3", this.div);
    var top    = mkdiv("", "view-container tlv-top background3", this.div);

    this.subDivs[this.ViewID.TOP]    = top;
    this.subDivs[this.ViewID.RIGHT]  = right;
    this.subDivs[this.ViewID.BOTTOM] = bottom;
    this.subDivs[this.ViewID.LEFT]   = left;
    this.subDivs[this.ViewID.CENTER] = center;

    this.topHeight    = 100;
    this.bottomHeight = 200;
    this.leftWidth    = 200;
    this.rightWidth   = 200;

    var that = this;

    top.resizable({ handles: "s" , resize: function(event, ui) { that.resizeTop(event, ui); } });
    left.resizable({ handles: "e" , resize: function(event, ui) { that.resizeLeft(event, ui); } });
    right.resizable({ handles: "w" , resize: function(event, ui) { that.resizeRight(event, ui); } });
    bottom.resizable({ handles: "n" , resize: function(event, ui) { that.resizeBottom(event, ui); } });

    this.doResize();

    if (container != null) {
        this.div.appendTo(container);
    }
}

TopLevelView.prototype = Object.create(View.prototype);
TopLevelView.prototype.constructor = TopLevelView;

TopLevelView.prototype.ViewID = {
    LEFT:       0,
    RIGHT:      1,
    TOP:        2,
    BOTTOM:     3,
    CENTER:     4,
    ENUM_COUNT: 5
};

TopLevelView.prototype.doResize = function() {
    this.width  = this.div.width();
    this.height = this.div.height();

    this.subDivs[this.ViewID.BOTTOM].css("height", this.bottomHeight - 1);
    this.subDivs[this.ViewID.BOTTOM].css("left", this.leftWidth);
    this.subDivs[this.ViewID.BOTTOM].css('top', this.height - this.bottomHeight);
    this.subDivs[this.ViewID.CENTER].css("bottom", this.bottomHeight - 1);
    this.subDivs[this.ViewID.CENTER].css("left", this.leftWidth);
    this.subDivs[this.ViewID.CENTER].css("right", this.rightWidth - 1);
    this.subDivs[this.ViewID.CENTER].css("top", this.topHeight);
    this.subDivs[this.ViewID.LEFT].css('right', this.leftWidth);
    this.subDivs[this.ViewID.LEFT].css("top", this.topHeight);
    this.subDivs[this.ViewID.LEFT].css("width", this.leftWidth - 1);
    this.subDivs[this.ViewID.RIGHT].css('left', this.width - this.rightWidth);
    this.subDivs[this.ViewID.RIGHT].css("top", this.topHeight);
    this.subDivs[this.ViewID.RIGHT].css("width", this.rightWidth - 1);
    this.subDivs[this.ViewID.TOP].css('bottom', this.height - this.topHeight);
    this.subDivs[this.ViewID.TOP].css("height", this.topHeight - 1);

    if (this.extraLargeRightView) {
        this.subDivs[this.ViewID.RIGHT].css("bottom", 0);
        this.subDivs[this.ViewID.BOTTOM].css('right', this.rightWidth);
    } else {
        this.subDivs[this.ViewID.RIGHT].css("bottom", this.bottomHeight);
        this.subDivs[this.ViewID.BOTTOM].css('right', 0);
    }

    if (this.subViews[this.ViewID.TOP] != null) {
        this.subViews[this.ViewID.TOP].setSize(this.width, this.topHeight);
    }
    if (this.subViews[this.ViewID.LEFT] != null) {
        this.subViews[this.ViewID.LEFT].setSize(this.leftWidth, this.height - this.topHeight);
    }
    if (this.subViews[this.ViewID.RIGHT] != null) {
        this.subViews[this.ViewID.RIGHT].setSize(this.rightWidth, this.height - this.topHeight - this.bottomHeight);
    }
    if (this.subViews[this.ViewID.BOTTOM] != null) {
        this.subViews[this.ViewID.BOTTOM].setSize(this.width - this.leftWidth, this.bottomHeight);
    }
    if (this.subViews[this.ViewID.CENTER] != null) {
        this.subViews[this.ViewID.CENTER].setSize(this.width - this.leftWidth - this.rightWidth, this.height - this.topHeight - this.bottomHeight);
    }
}

TopLevelView.prototype.setSubView = function(id, subView) {
    if (this.subViews[id] != null) {
        this.subViews[id].div.remove();
    }

    this.subViews[id] = subView;

    if (subView != null) {
        subView.div.appendTo(this.subDivs[id]);
        if (id == this.ViewID.LEFT) {
            this.leftWidth = subView.width;
        } else if (id == this.ViewID.RIGHT) {
            this.rightWidth = subView.width;
        } else if (id == this.ViewID.TOP) {
            this.topHeight = subView.height;
        } else if (id == this.ViewID.BOTTOM) {
            this.bottomHeight = subView.height;
        }
    } else {
        if (id == this.ViewID.LEFT) {
            this.leftWidth = 0;
        } else if (id == this.ViewID.RIGHT) {
            this.rightWidth = 0;
        } else if (id == this.ViewID.TOP) {
            this.topHeight = 0;
        } else if (id == this.ViewID.BOTTOM) {
            this.bottomHeight = 0;
        }
    }

    this.doResize();
}

TopLevelView.prototype.setLeft = function(left) {
    this.setSubView(this.ViewID.LEFT, left);
}

TopLevelView.prototype.setRight = function(right) {
    this.setSubView(this.ViewID.RIGHT, right);
}

TopLevelView.prototype.setBottom = function(bottom) {
    this.setSubView(this.ViewID.BOTTOM, bottom);
}

TopLevelView.prototype.setTop = function(top) {
    this.setSubView(this.ViewID.TOP, top);
}

TopLevelView.prototype.setCenter = function(center) {
    this.setSubView(this.ViewID.CENTER, center);
}

TopLevelView.prototype.resizeLeft = function(event, ui) {
    this.leftWidth = ui.size.width;
    doResize();
}

TopLevelView.prototype.resizeRight = function(event, ui) {
    this.rightWidth = ui.size.width;
    doResize();
}

TopLevelView.prototype.resizeTop = function(event, ui) {
    this.topHeight = ui.size.height;
    doResize();
}

TopLevelView.prototype.resizeBottom = function(event, ui) {
    this.bottomHeight = ui.size.height;
    doResize();
}


var topLevelView;

var doResize = function() {
    topLevelView.doResize();
}

//var renderView;
//var datView;

$(document).ready(function() {
    renderView = new EmptyView(-1, -1);
    //datView = new EmptyView(300, -1);

    topLevelView = new TopLevelView($('#main'));
    topLevelView.setLeft   (new TestView(400, -1, "left"));
    topLevelView.setRight  (new TestView(300, -1, "right"));
    topLevelView.setTop    (new TestView(-1, 100, "top"));
    topLevelView.setBottom (new TestView(-1, 250, "bottom"));
    topLevelView.setCenter (new TestView(-1, -1, "center"));
    $(window).resize(doResize);
});
