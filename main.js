var Vec2 = /** @class */ (function () {
    function Vec2(x, y) {
        this.x = x;
        this.y = y;
    }
    return Vec2;
}());
var Vec3 = /** @class */ (function () {
    function Vec3(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    return Vec3;
}());
function arr_to_vec2(arr) {
    if (arr.length != 2) {
        throw new Error("array must have exactly 2 elements");
    }
    return new Vec2(arr[0], arr[1]);
}
function arr_to_vec3(arr) {
    if (arr.length != 3) {
        throw new Error("array must have exactly 3 elements");
    }
    return new Vec3(arr[0], arr[1], arr[2]);
}
var Param = /** @class */ (function () {
    function Param(id, name, value, element, change_event, render_event, config) {
        if (element === void 0) { element = null; }
        if (change_event === void 0) { change_event = null; }
        if (render_event === void 0) { render_event = null; }
        if (config === void 0) { config = {}; }
        this._id = id;
        this._name = name;
        this._value = deep_clone(value);
        if (element === "use-id") {
            this._element = document.getElementById(this._id);
        }
        else {
            this._element = element;
        }
        this._change_event = change_event;
        this._render_event = render_event;
        this._config = deep_clone(config);
        this.render();
    }
    Param.prototype.id = function () {
        return this._id;
    };
    Param.prototype.name = function () {
        return this._name;
    };
    Param.prototype.set_name = function (new_name) {
        this._name = new_name;
        this.render_from_scratch();
    };
    Param.prototype.element = function () {
        return this._element;
    };
    Param.prototype.set_element = function (new_element) {
        this._element = new_element;
    };
    Param.prototype.change_event = function () {
        return this._change_event;
    };
    Param.prototype.set_change_event = function (new_event) {
        this._change_event = new_event;
    };
    Param.prototype.render_event = function () {
        return this._render_event;
    };
    Param.prototype.set_render_event = function (new_event) {
        this._render_event = new_event;
    };
    Param.prototype.config = function () {
        return this._config;
    };
    Param.prototype.set_config = function (new_config) {
        this._config = deep_clone(new_config);
    };
    Param.prototype.get = function () {
        return this._value;
    };
    Param.prototype.set = function (new_value, invoke_change_event) {
        if (invoke_change_event === void 0) { invoke_change_event = false; }
        if (typeof new_value !== typeof this._value) {
            throw new Error("can't change parameter's value type after it's been " +
                "constructed.");
        }
        var old_value = deep_clone(this._value);
        this._value = deep_clone(new_value);
        if (invoke_change_event && this._change_event !== null) {
            this._change_event(this, old_value, this._value, true);
        }
        this.render();
    };
    Param.prototype.get_string = function () {
        var unit_str = "";
        if (typeof (this._config.value_unit) === "string") {
            unit_str = " " + this._config.value_unit;
        }
        if (typeof this._value === "number") {
            var s_value = number_to_str(this._value, this._config.decimal_digits);
            return s_value + unit_str;
        }
        else if (this._value instanceof Vec2) {
            var s_value_x = number_to_str(this._value.x, this._config.decimal_digits);
            var s_value_y = number_to_str(this._value.y, this._config.decimal_digits);
            return "".concat(s_value_x).concat(unit_str, ", ").concat(s_value_y).concat(unit_str);
        }
        else {
            throw new Error("unsupported value type");
        }
    };
    Param.prototype.render_from_scratch = function () {
        var _this = this;
        if (this._element === null) {
            return;
        }
        var elem = document.createElement("div");
        elem.id = this._element.id;
        elem.toggleAttribute("has-ever-rendered", true);
        elem.className = "control-container";
        var label = elem.appendChild(document.createElement("div"));
        label.className = "control-label";
        label.textContent = this._name;
        if (typeof this._value === "number") {
            var slider = elem.appendChild(slider_create((this._config.min || 0.), (this._config.max || 1.), (this._config.step || .001), this._value));
            var indicator_1 = slider_get_indicator(slider);
            indicator_1.innerHTML = this.get_string();
            var input_1 = slider_get_input(slider);
            input_1.addEventListener("input", function () {
                var old_value = deep_clone(_this._value);
                _this._value = parseFloat(input_1.value);
                indicator_1.innerHTML = _this.get_string();
                if (_this._change_event !== null) {
                    _this._change_event(_this, old_value, _this._value, false);
                }
            });
        }
        else if (this._value instanceof Vec2) {
            var input_x_1 = elem.appendChild(document.createElement("input"));
            input_x_1.className = "control";
            input_x_1.type = "range";
            input_x_1.min = (this._config.min || 0.).toString();
            input_x_1.max = (this._config.max || 1.).toString();
            input_x_1.step = (this._config.step || .001).toString();
            input_x_1.value = this._value.toString();
            input_x_1.addEventListener("input", function () {
                var old_value = deep_clone(_this._value);
                _this._value.x = parseFloat(input_x_1.value);
                if (_this._change_event !== null) {
                    _this._change_event(_this, old_value, _this._value, false);
                }
            });
            var input_y_1 = elem.appendChild(document.createElement("input"));
            input_y_1.className = "control";
            input_y_1.type = "range";
            input_y_1.min = input_x_1.min;
            input_y_1.max = input_x_1.max;
            input_y_1.step = input_x_1.step;
            input_y_1.value = this._value.toString();
            input_y_1.addEventListener("input", function () {
                var old_value = deep_clone(_this._value);
                _this._value.y = parseFloat(input_y_1.value);
                if (_this._change_event !== null) {
                    _this._change_event(_this, old_value, _this._value, false);
                }
            });
        }
        else {
            throw new Error("unsupported value type");
        }
        this._element.replaceWith(elem);
        this._element = elem;
        if (this._render_event !== null) {
            this._render_event(this);
        }
    };
    Param.prototype.render = function () {
        if (this._element === null) {
            return;
        }
        if (!this._element.hasAttribute("has-ever-rendered")) {
            this.render_from_scratch();
            return;
        }
        if (typeof this._value === "number") {
            var slider = this._element.getElementsByClassName("slider-wrapper")[0];
            var input = slider_get_input(slider);
            input.value = this._value.toString();
            var indicator = slider_get_indicator(slider);
            indicator.innerHTML = this.get_string();
        }
        else if (this._value instanceof Vec2) {
            var inputs = this._element.getElementsByTagName("input");
            inputs[0].value = this._value.x.toString();
            inputs[1].value = this._value.y.toString();
        }
        else {
            throw new Error("unsupported value type");
        }
        if (this._render_event !== null) {
            this._render_event(this);
        }
    };
    return Param;
}());
var ParamList = /** @class */ (function () {
    function ParamList() {
        this.params = [];
    }
    ParamList.prototype.add = function (new_param) {
        for (var _i = 0, _a = this.params; _i < _a.length; _i++) {
            var param = _a[_i];
            if (param.id() === new_param.id()) {
                throw new Error("another parameter with the same ID is already in the list");
            }
        }
        this.params.push(new_param);
        new_param.render();
    };
    ParamList.prototype.get = function (id) {
        for (var _i = 0, _a = this.params; _i < _a.length; _i++) {
            var param = _a[_i];
            if (param.id() === id) {
                return param;
            }
        }
        return null;
    };
    ParamList.prototype.render_all = function () {
        for (var _i = 0, _a = this.params; _i < _a.length; _i++) {
            var param = _a[_i];
            param.render();
        }
    };
    return ParamList;
}());
var state = {
    canvas_ready: false,
    canvas: null,
    gl: null,
    program: null,
    vbo: null
};
var param_list = new ParamList();
var default_params = []; // backup of the initial values
function reset_params() {
    for (var _i = 0, default_params_1 = default_params; _i < default_params_1.length; _i++) {
        var param = default_params_1[_i];
        param_list.get(param.id()).set(param.get());
    }
    render_canvas();
}
function init() {
    // add parameters
    param_list.add(new Param("tile_size", "Tile Size", new Vec2(200., 400.), "use-id", function () { return render_canvas(); }, null, { min: 10., max: 1000., step: 1., value_unit: "px", decimal_digits: 0 }));
    param_list.add(new Param("border_thickness", "Border Thickness", 3., "use-id", function () { return render_canvas(); }, null, { min: 0., max: 20., step: .25, value_unit: "px", decimal_digits: 2 }));
    param_list.add(new Param("grid_lines_density", "Density", 400., "use-id", function () { return render_canvas(); }, null, { min: 1., max: 2000., step: 1., decimal_digits: 0 }));
    param_list.add(new Param("grid_lines_thickness", "Thickness", 1., "use-id", function () { return render_canvas(); }, null, { min: 0., max: 20., step: .25, value_unit: "px", decimal_digits: 2 }));
    param_list.add(new Param("grid_lines_opacity_horizontal", "Horizontal Lines", 0., "use-id", function () { return render_canvas(); }, null, { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("grid_lines_opacity_vertical", "Vertical Lines", .05, "use-id", function () { return render_canvas(); }, null, { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("masjad_position", "Position", .125, "use-id", function () { return render_canvas(); }, null, { min: 0., max: .5, step: .001, decimal_digits: 2 }));
    param_list.add(new Param("masjad_radius", "Radius", .05, "use-id", function () { return render_canvas(); }, null, { min: 0., max: .5, step: .001, decimal_digits: 2 }));
    param_list.add(new Param("feet_vertical_position", "Position", .2, "use-id", function () { return render_canvas(); }, null, { min: 0., max: .5, step: .001, decimal_digits: 2 }));
    param_list.add(new Param("feet_horizontal_distance", "Distance", .12, "use-id", function () { return render_canvas(); }, null, { min: 0., max: .3, step: .001, decimal_digits: 2 }));
    param_list.add(new Param("feet_thickness", "Thickness", 1., "use-id", function () { return render_canvas(); }, null, { min: 0., max: 20., step: .25, value_unit: "px", decimal_digits: 2 }));
    param_list.add(new Param("feet_opacity", "Opacity", 1., "use-id", function () { return render_canvas(); }, null, { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("feet_size", "Size", new Vec2(.05, .13), "use-id", function () { return render_canvas(); }, null, { min: 0., max: .3, step: .001, decimal_digits: 2 }));
    param_list.add(new Param("transform_scale", "Scale", new Vec2(1., 1.), "use-id", function () { return render_canvas(); }, null, { min: .1, max: 3., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("transform_skew", "Skew", new Vec2(0., 0.), "use-id", function () { return render_canvas(); }, null, { min: -1., max: 1., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("transform_rotation", "Rotation", 0., "use-id", function () { return render_canvas(); }, null, { min: -180., max: 180., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("transform_offset", "Offset", new Vec2(0., 0.), "use-id", function () { return render_canvas(); }, null, { min: -200., max: 200., step: .25, value_unit: "px", decimal_digits: 2 }));
    param_list.add(new Param("background_color_h", "Hue", 0., "use-id", function () { update_color_blobs(); render_canvas(); }, function () { return update_color_blobs(); }, { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("background_color_s", "Saturation", 0., "use-id", function () { update_color_blobs(); render_canvas(); }, function () { return update_color_blobs(); }, { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("background_color_v", "Value", 0., "use-id", function () { update_color_blobs(); render_canvas(); }, function () { return update_color_blobs(); }, { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("pattern_color_h", "Hue", 0., "use-id", function () { update_color_blobs(); render_canvas(); }, function () { return update_color_blobs(); }, { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("pattern_color_s", "Saturation", 0., "use-id", function () { update_color_blobs(); render_canvas(); }, function () { return update_color_blobs(); }, { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("pattern_color_v", "Value", 1., "use-id", function () { update_color_blobs(); render_canvas(); }, function () { return update_color_blobs(); }, { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    // make a copy of the initial values to use in reset_params()
    default_params = deep_clone(param_list.params);
    // render
    init_canvas();
    render_canvas();
}
function viewport_resized() {
    init_canvas();
    render_canvas();
}
function update_color_blobs() {
    var _a, _b, _c, _d, _e, _f;
    var background_color = view_transform(hsv_to_rgb([
        (((_a = param_list.get("background_color_h")) === null || _a === void 0 ? void 0 : _a.get()) || 0.),
        (((_b = param_list.get("background_color_s")) === null || _b === void 0 ? void 0 : _b.get()) || 0.),
        (((_c = param_list.get("background_color_v")) === null || _c === void 0 ? void 0 : _c.get()) || 0.)
    ]));
    var pattern_color = view_transform(hsv_to_rgb([
        (((_d = param_list.get("pattern_color_h")) === null || _d === void 0 ? void 0 : _d.get()) || 0.),
        (((_e = param_list.get("pattern_color_s")) === null || _e === void 0 ? void 0 : _e.get()) || 0.),
        (((_f = param_list.get("pattern_color_v")) === null || _f === void 0 ? void 0 : _f.get()) || 0.)
    ]));
    document.getElementById("background_color_blob").style.backgroundColor =
        "rgb(".concat(background_color.join(", "), ")");
    document.getElementById("pattern_color_blob").style.backgroundColor =
        "rgb(".concat(pattern_color.join(", "), ")");
}
function init_canvas() {
    state.canvas_ready = false;
    // try to get WebGL2 context
    state.canvas = document.getElementById("canvas");
    state.gl = state.canvas.getContext("webgl2");
    if (state.gl) {
        document.getElementById("error-message").style.visibility = "collapse";
    }
    else {
        console.error("failed to get WebGL2 rendering context");
        document.getElementById("error-message").style.visibility = "visible";
        document.getElementById("controls").style.visibility = "collapse";
        return;
    }
    // viewport resolution
    var dpr = window.devicePixelRatio || 1;
    state.canvas.width = Math.floor(document.body.clientWidth * dpr);
    state.canvas.height = Math.floor(document.body.clientHeight * dpr);
    state.gl.viewport(0, 0, state.canvas.width, state.canvas.height);
    // high DPI nonsense
    state.canvas.style.width = "".concat(Math.floor(state.canvas.width / dpr), "px");
    state.canvas.style.height = "".concat(Math.floor(state.canvas.height / dpr), "px");
    // vertex shader
    var vertex_source = "#version 300 es\nin vec2 a_position;\nout vec2 v_uv;\n\nvoid main() {\n    v_uv = (a_position + 1.) * .5;\n    gl_Position = vec4(a_position, 0., 1.);\n}\n";
    // fragment shader
    var fragment_source = "#version 300 es\n\nprecision highp float;\nprecision highp int;\n\nin vec2 v_uv;\nout vec4 out_color;\n\n// render resolution\nuniform vec2 res;\n\n// tile\nuniform vec2 tile_size; // px\nuniform float border_thickness; // px\n\n// grid lines\nuniform float grid_lines_density;\nuniform float grid_lines_thickness; // px\nuniform float grid_lines_opacity_horizontal;\nuniform float grid_lines_opacity_vertical;\n\n// masjad\nuniform float masjad_position; // 0 = top, 1 = bottom\nuniform float masjad_radius; // relative to tile size\n\n// feet\nuniform float feet_vertical_position; // 0 = bottom, 1 = top\nuniform float feet_horizontal_distance; // relative to tile size\nuniform vec2 feet_size; // relative to tile size\nuniform float feet_thickness; // px\nuniform float feet_opacity;\n\n// transform\nuniform vec2 transform_scale;\nuniform vec2 transform_skew;\nuniform float transform_rotation; // degrees\nuniform vec2 transform_offset; // px\n\n// colors\nuniform vec3 background_color;\nuniform vec3 pattern_color;\n\n/*__________ hash function collection _________*/\n// sources: https://nullprogram.com/blog/2018/07/31/\n//          https://www.shadertoy.com/view/WttXWX\n\nuint triple32(uint x)\n{\n    x ^= x >> 17;\n    x *= 0xed5ad4bbU;\n    x ^= x >> 11;\n    x *= 0xac4c1b51U;\n    x ^= x >> 15;\n    x *= 0x31848babU;\n    x ^= x >> 14;\n    return x;\n}\n\n// uint -> uint\n\nuint hash(uint v)\n{\n    return triple32(v);\n}\n\nuint hash(uvec2 v)\n{\n    return triple32(v.x + triple32(v.y));\n}\n\nuint hash(uvec3 v)\n{\n    return triple32(v.x + triple32(v.y + triple32(v.z)));\n}\n\nuint hash(uvec4 v)\n{\n    return triple32(v.x + triple32(v.y + triple32(v.z + triple32(v.w))));\n}\n\n// int -> uint\n\nuint hash(int v)\n{\n    return triple32(uint(v));\n}\n\nuint hash(ivec2 v)\n{\n    return triple32(uint(v.x) + triple32(uint(v.y)));\n}\n\nuint hash(ivec3 v)\n{\n    return triple32(uint(v.x) + triple32(uint(v.y) + triple32(uint(v.z))));\n}\n\nuint hash(ivec4 v)\n{\n    return triple32(uint(v.x) + triple32(uint(v.y) + triple32(uint(v.z) + triple32(uint(v.w)))));\n}\n\n// float -> uint\n\nuint hash(float v)\n{\n    return triple32(floatBitsToUint(v));\n}\n\nuint hash(vec2 v)\n{\n    return triple32(floatBitsToUint(v.x) + triple32(floatBitsToUint(v.y)));\n}\n\nuint hash(vec3 v)\n{\n    return triple32(floatBitsToUint(v.x) + triple32(floatBitsToUint(v.y) + triple32(floatBitsToUint(v.z))));\n}\n\nuint hash(vec4 v)\n{\n    return triple32(floatBitsToUint(v.x) + triple32(floatBitsToUint(v.y) + triple32(floatBitsToUint(v.z) + triple32(floatBitsToUint(v.w)))));\n}\n\n// any -> int\n#define hashi(v) int(hash(v))\n\n// any -> float\n#define hashf(v) (float(hash(v)) / 4294967295.)\n\n/*____________________ end ____________________*/\n\n#define inv_step(a, b) (step(b, a))\n\nmat2 rotate_2d(float angle)\n{\n    float s = sin(angle);\n    float c = cos(angle);\n    return mat2(\n        c, s,\n        -s, c\n    );\n}\n\n// ellipse signed distance\n// source (minor tweaks): https://www.shadertoy.com/view/4sS3zz\nfloat msign(in float x) { return (x<0.0)?-1.0:1.0; }\nfloat sd_ellipse(vec2 p, vec2 ab)\n{\n  //if( ab.x==ab.y ) return length(p)-ab.x;\n\n    float aspect_ratio = ab.y / ab.x;\n    if (abs(aspect_ratio - 1.) < .001)\n    {\n        return length(p) - ab.x;\n    }\n\n\tp = abs( p ); \n    if( p.x>p.y ){ p=p.yx; ab=ab.yx; }\n\t\n\tfloat l = ab.y*ab.y - ab.x*ab.x;\n    float m = ab.x*p.x/l; float m2 = m*m;\n\tfloat n = ab.y*p.y/l; float n2 = n*n;\n    float c = (m2+n2-1.0)/3.0; float c2 = c*c; float c3 = c*c2;\n    float d = c3 + m2*n2;\n    float q = d  + m2*n2;\n    float g = m  + m *n2;\n\n    float co;\n\n    if( d<0.0 )\n    {\n        float h = acos(q/c3)/3.0;\n        float s = cos(h); s += 2.0;\n        float t = sin(h); t *= sqrt(3.0);\n        float rx = sqrt( m2-c*(s+t) );\n        float ry = sqrt( m2-c*(s-t) );\n        co = ry + sign(l)*rx + abs(g)/(rx*ry);\n    }\n    else                                    // d>0\n    {                                       // q>0\n        float h = 2.0*m*n*sqrt(d);          // h>0\n        float s = pow(q+h, 1.0/3.0 );       // s>0\n        float t = c2/s;                     // t>0\n        float rx = -(s+t) - c*4.0 + 2.0*m2;\n        float ry =  (s-t)*sqrt(3.0);\n        float rm = sqrt( rx*rx + ry*ry );\n        co = ry/sqrt(rm-rx) + 2.0*g/rm;\n    }\n    co = (co-m)/2.0;\n\n    float si = sqrt( max(1.0-co*co,0.0) );\n \n    vec2 r = ab * vec2(co,si);\n\t\n    return length(r-p) * msign(p.y-r.y);\n}\n\nvec3 render(vec2 coord)\n{\n    // center coord\n    coord -= (res * .5);\n\n    // transform (remember RORO: reverse order, reverse operation)\n    coord -= transform_offset;\n    coord *= rotate_2d(-radians(transform_rotation));\n    coord.x -= transform_skew.x * coord.y;\n    coord.y -= transform_skew.y * coord.x;\n    coord /= transform_scale;\n\n    // 2D index of the current tile\n    ivec2 itile = ivec2(floor(coord / tile_size));\n\n    // pixel position relative to the current tile's bottom left corner\n    vec2 tile_coord = mod(coord, tile_size);\n    \n    // use sqrt(tile area) as a reference to scale elements\n    float overall_scale = sqrt(tile_size.x * tile_size.y);\n\n    float v = 0.;\n\n    // border\n    {\n        float half_thickness = border_thickness * .5;\n        float half_tile_w = tile_size.x * .5;\n        float half_tile_h = tile_size.y * .5;\n        v = max(\n            inv_step(\n                abs(tile_coord.x - half_tile_w),\n                half_tile_w - half_thickness\n            ),\n            inv_step(\n                abs(tile_coord.y - half_tile_h),\n                half_tile_h - half_thickness\n            )\n        );\n    }\n    \n    // grid lines\n    {\n        float grid_lines_res_x = max(\n            ceil(sqrt(\n                grid_lines_density * tile_size.x / tile_size.y\n            )),\n            1.\n        );\n        float grid_lines_res_y = max(\n            ceil(grid_lines_density / float(grid_lines_res_x)),\n            1.\n        );\n\n        vec2 grid_cell_size =\n            tile_size / vec2(grid_lines_res_x, grid_lines_res_y);\n\n        float half_thickness = grid_lines_thickness * .5;\n        float half_cell_w = grid_cell_size.x * .5;\n        float half_cell_h = grid_cell_size.y * .5;\n\n        // vertical lines\n        v = max(\n            v,\n            inv_step(\n                abs(mod(tile_coord.x, grid_cell_size.x) - half_cell_w),\n                half_cell_w - half_thickness\n            ) * grid_lines_opacity_vertical\n        );\n\n        // horizontal lines\n        v = max(\n            v,\n            inv_step(\n                abs(mod(tile_coord.y, grid_cell_size.y) - half_cell_h),\n                half_cell_h - half_thickness\n            ) * grid_lines_opacity_horizontal\n        );\n    }\n\n    // masjad\n    {\n        vec2 circle_center = vec2(\n            tile_size.x * .5,\n            tile_size.y * (1. - masjad_position)\n        );\n        float circle_radius = masjad_radius * overall_scale;\n\n        float sd = distance(tile_coord, circle_center) - circle_radius;\n        v = max(v, step(sd, 0.));\n    }\n\n    // feet\n    {\n        vec2 left_ellipse_center = vec2(\n            tile_size.x * .5 - (feet_horizontal_distance * overall_scale),\n            tile_size.y * feet_vertical_position\n        );\n\n        vec2 right_ellipse_center = vec2(\n            tile_size.x * .5 + (feet_horizontal_distance * overall_scale),\n            tile_size.y * feet_vertical_position\n        );\n\n        vec2 ellipse_radius = feet_size * overall_scale;\n        float half_thickness = feet_thickness * .5;\n\n        float sd = min(\n            abs(sd_ellipse(\n                tile_coord - left_ellipse_center,\n                ellipse_radius\n            )) - half_thickness,\n            abs(sd_ellipse(\n                tile_coord - right_ellipse_center,\n                ellipse_radius\n            )) - half_thickness\n        );\n\n        v = max(v, step(sd, 0.) * feet_opacity);\n    }\n\n    // colorize and return\n    return mix(\n        background_color,\n        pattern_color,\n        v\n    );\n}\n\nvec3 view_transform(vec3 col)\n{\n    // OETF (Linear BT.709 -> sRGB 2.2)\n    return pow(clamp(col, 0., 1.), vec3(1. / 2.2));\n}\n\nvoid main()\n{\n    // current pixel position\n    vec2 frag_coord = gl_FragCoord.xy;\n\n    // render (average multiple samples)\n    vec3 col = vec3(0);\n    const int N_SAMPLES = 32;\n    for (int i = 0; i < N_SAMPLES; i++)\n    {\n        vec2 jitter_offs = vec2(\n            hashf(ivec2(i, 10)),\n            hashf(ivec2(i, 20))\n        ) - .5;\n        \n        col += render(frag_coord + jitter_offs);\n    }\n    col /= float(N_SAMPLES);\n    \n    // output\n    col = view_transform(col);\n    out_color = vec4(col, 1);\n}\n";
    try {
        // create graphics program (pipeline)
        state.program = create_program(vertex_source, fragment_source);
        // fullscreen quad [-1, -1] to [1, 1]
        var quad_verts = new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1
        ]);
        // create vertex buffer object (VBO)
        state.vbo = state.gl.createBuffer();
        if (!state.vbo) {
            throw new Error("failed to create empty buffer");
        }
        state.gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, state.vbo);
        state.gl.bufferData(WebGL2RenderingContext.ARRAY_BUFFER, quad_verts, WebGL2RenderingContext.STATIC_DRAW);
        // define vertex attributes layout in the VBO
        var position_loc = state.gl.getAttribLocation(state.program, "a_position");
        state.gl.enableVertexAttribArray(position_loc);
        state.gl.vertexAttribPointer(position_loc, 2, WebGL2RenderingContext.FLOAT, false, 0, 0);
        // update state
        state.canvas_ready = true;
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("failed to initialize canvas: ", error.message);
        }
        else {
            console.error("failed to initialize canvas: ", error);
        }
    }
}
function render_canvas() {
    if (state.canvas_ready !== true) {
        console.log("can't render because canvas is not ready.");
        return;
    }
    // bind graphics program (pipeline)
    state.gl.useProgram(state.program);
    // set uniforms
    {
        // render resolution
        set_uniform(state.program, "res", new Vec2(state.canvas.width, state.canvas.height));
        // tile
        set_uniform(state.program, "tile_size", param_list.get("tile_size").get());
        set_uniform(state.program, "border_thickness", param_list.get("border_thickness").get());
        // grid lines
        set_uniform(state.program, "grid_lines_density", param_list.get("grid_lines_density").get());
        set_uniform(state.program, "grid_lines_thickness", param_list.get("grid_lines_thickness").get());
        set_uniform(state.program, "grid_lines_opacity_horizontal", param_list.get("grid_lines_opacity_horizontal").get());
        set_uniform(state.program, "grid_lines_opacity_vertical", param_list.get("grid_lines_opacity_vertical").get());
        // masjad
        set_uniform(state.program, "masjad_position", param_list.get("masjad_position").get());
        set_uniform(state.program, "masjad_radius", param_list.get("masjad_radius").get());
        // feet
        set_uniform(state.program, "feet_vertical_position", param_list.get("feet_vertical_position").get());
        set_uniform(state.program, "feet_horizontal_distance", param_list.get("feet_horizontal_distance").get());
        set_uniform(state.program, "feet_size", param_list.get("feet_size").get());
        set_uniform(state.program, "feet_thickness", param_list.get("feet_thickness").get());
        set_uniform(state.program, "feet_opacity", param_list.get("feet_opacity").get());
        // transform
        set_uniform(state.program, "transform_scale", param_list.get("transform_scale").get());
        set_uniform(state.program, "transform_skew", param_list.get("transform_skew").get());
        set_uniform(state.program, "transform_rotation", param_list.get("transform_rotation").get());
        set_uniform(state.program, "transform_offset", param_list.get("transform_offset").get());
        // colors
        var background_color = hsv_to_rgb([
            param_list.get("background_color_h").get(),
            param_list.get("background_color_s").get(),
            param_list.get("background_color_v").get()
        ]);
        var pattern_color = hsv_to_rgb([
            param_list.get("pattern_color_h").get(),
            param_list.get("pattern_color_s").get(),
            param_list.get("pattern_color_v").get()
        ]);
        set_uniform(state.program, "background_color", arr_to_vec3(background_color));
        set_uniform(state.program, "pattern_color", arr_to_vec3(pattern_color));
    }
    // bind VBO
    state.gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, state.vbo);
    // draw
    state.gl.clearColor(0, 0, 0, 1);
    state.gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT);
    state.gl.drawArrays(WebGL2RenderingContext.TRIANGLES, 0, 6);
}
function create_shader(type, source) {
    var shader = state.gl.createShader(type);
    if (!shader) {
        throw new Error("failed to create empty shader of type ".concat(type));
    }
    state.gl.shaderSource(shader, source);
    state.gl.compileShader(shader);
    if (!state.gl.getShaderParameter(shader, WebGL2RenderingContext.COMPILE_STATUS)) {
        var info = state.gl.getShaderInfoLog(shader) || "(no info)";
        throw new Error("failed to compile shader of type ".concat(type, ": ").concat(info));
    }
    return shader;
}
function create_program(vertex_source, fragment_source) {
    var program = state.gl.createProgram();
    var vs = create_shader(WebGL2RenderingContext.VERTEX_SHADER, vertex_source);
    var fs = create_shader(WebGL2RenderingContext.FRAGMENT_SHADER, fragment_source);
    state.gl.attachShader(program, vs);
    state.gl.attachShader(program, fs);
    state.gl.linkProgram(program);
    if (!state.gl.getProgramParameter(program, WebGL2RenderingContext.LINK_STATUS)) {
        var info = state.gl.getProgramInfoLog(program) || "(no info)";
        throw new Error("failed to link graphics program: ".concat(info));
    }
    return program;
}
// example dimensions: 1f (float), 3i (ivec3), basically the suffix after
// "gl.uniform".
function set_uniform(program, name, value) {
    var location = state.gl.getUniformLocation(program, name);
    if (!location) {
        return false;
    }
    if (typeof value === "number") {
        state.gl.uniform1f(location, value);
    }
    else if (value instanceof Vec2) {
        state.gl.uniform2f(location, value.x, value.y);
    }
    else if (value instanceof Vec3) {
        state.gl.uniform3f(location, value.x, value.y, value.z);
    }
    else {
        throw new Error("unsupported uniform type");
    }
    return true;
}
function clamp01(v) {
    return Math.min(Math.max(v, 0.), 1.);
}
function view_transform(rgb) {
    return rgb.map(function (v) { return Math.round(255. * Math.pow(clamp01(v), 1. / 2.2)); });
}
// source (minor tweaks): https://stackoverflow.com/a/17243070
function hsv_to_rgb(hsv) {
    var h = clamp01(hsv[0]);
    var s = clamp01(hsv[1]);
    var v = clamp01(hsv[2]);
    var r = 0, g = 0, b = 0;
    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0:
            r = v, g = t, b = p;
            break;
        case 1:
            r = q, g = v, b = p;
            break;
        case 2:
            r = p, g = v, b = t;
            break;
        case 3:
            r = p, g = q, b = v;
            break;
        case 4:
            r = t, g = p, b = v;
            break;
        case 5:
            r = v, g = p, b = q;
            break;
    }
    return [r, g, b];
}
function deep_clone(v) {
    // null or primitive types
    if (v === null || typeof v !== 'object') {
        return v;
    }
    // built-in types that should be copied by constructor
    if (v instanceof Date) {
        return new Date(v.getTime());
    }
    /*if (v instanceof RegExp) {
        return new RegExp(v.source, v.flags) as T;
    }*/
    // arrays
    if (Array.isArray(v)) {
        return v.map(function (item) { return deep_clone(item); });
    }
    // at this point, v is either a class instance of a plain object, so let's
    // check that.
    var proto = Object.getPrototypeOf(v);
    var is_plain = (proto === Object.prototype || proto === null);
    // class instance (non-plain objects)
    if (!is_plain) {
        var cloned_instance = Object.create(proto);
        for (var _i = 0, _a = Object.getOwnPropertyNames(v); _i < _a.length; _i++) {
            var key = _a[_i];
            cloned_instance[key] = deep_clone(v[key]);
        }
        return cloned_instance;
    }
    // try structuredClone() for plain objects
    if (typeof structuredClone === 'function') {
        try {
            return structuredClone(v);
        }
        catch (_b) {
            // fallback below
        }
    }
    // fallback if structuredClone() failed
    var clone = {};
    for (var key in v) {
        if (Object.prototype.hasOwnProperty.call(v, key)) {
            clone[key] = deep_clone(v[key]);
        }
    }
    return clone;
}
function slider_create(min, max, step, value) {
    var slider_wrapper = document.createElement("div");
    slider_wrapper.className = "control slider-wrapper";
    var input = slider_wrapper.appendChild(document.createElement("input"));
    input.className = "slider-input";
    input.type = "range";
    input.min = min.toString();
    input.max = max.toString();
    input.step = step.toString();
    input.value = value.toString();
    var indicator = slider_wrapper.appendChild(document.createElement("div"));
    indicator.className = "slider-indicator";
    input.addEventListener("mouseenter", function () {
        indicator.classList.add("slider-indicator-show");
    });
    input.addEventListener("mouseleave", function () {
        indicator.classList.remove("slider-indicator-show");
    });
    return slider_wrapper;
}
function slider_get_input(elem) {
    return elem.getElementsByTagName("input")[0];
}
function slider_get_indicator(elem) {
    return elem.getElementsByTagName("div")[0];
}
function number_to_str(v, decimal_digits) {
    if (decimal_digits === void 0) { decimal_digits = undefined; }
    if (typeof decimal_digits === "number") {
        return v.toFixed(decimal_digits);
    }
    else {
        return v.toString();
    }
}
