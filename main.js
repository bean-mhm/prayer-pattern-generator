"use strict";
class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
class Vec3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}
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
function clamp01(v) {
    return Math.min(Math.max(v, 0.), 1.);
}
function view_transform(rgb) {
    return rgb.map(v => Math.round(255. * Math.pow(clamp01(v), 1. / 2.2)));
}
// source (minor tweaks): https://stackoverflow.com/a/17243070
function hsv_to_rgb(hsv) {
    let h = clamp01(hsv[0]);
    let s = clamp01(hsv[1]);
    let v = clamp01(hsv[2]);
    let r = 0, g = 0, b = 0;
    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);
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
        return v.map(item => deep_clone(item));
    }
    // at this point, v is either a class instance of a plain object, so let's
    // check that.
    const proto = Object.getPrototypeOf(v);
    const is_plain = (proto === Object.prototype || proto === null);
    // class instance (non-plain objects)
    if (!is_plain) {
        const cloned_instance = Object.create(proto);
        for (const key of Object.getOwnPropertyNames(v)) {
            cloned_instance[key] = deep_clone(v[key]);
        }
        return cloned_instance;
    }
    // try structuredClone() for plain objects
    if (typeof structuredClone === 'function') {
        try {
            return structuredClone(v);
        }
        catch (_a) {
            // fallback below
        }
    }
    // fallback if structuredClone() failed
    const clone = {};
    for (const key in v) {
        if (Object.prototype.hasOwnProperty.call(v, key)) {
            clone[key] = deep_clone(v[key]);
        }
    }
    return clone;
}
function browse_file() {
    return new Promise((resolve, reject) => {
        // create a hidden file input element
        const input = document.body.appendChild(document.createElement('input'));
        input.type = 'file';
        input.style.display = 'none';
        input.addEventListener('change', () => {
            var _a;
            const file = (_a = input.files) === null || _a === void 0 ? void 0 : _a[0];
            if (!file) {
                cleanup();
                return reject(new Error('no file selected'));
            }
            const reader = new FileReader();
            reader.onload = () => {
                cleanup();
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                }
                else {
                    reject(new Error('File could not be read as text.'));
                }
            };
            reader.onerror = () => {
                cleanup();
                reject(new Error('Error reading file.'));
            };
            reader.readAsText(file);
        });
        input.click();
        function cleanup() {
            input.remove();
        }
    });
}
function load_text_from_file() {
    return new Promise((resolve, reject) => {
        const input = document.body.appendChild(document.createElement("input"));
        input.type = "file";
        input.style.display = "none";
        input.addEventListener("change", () => {
            var _a;
            const file = (_a = input.files) === null || _a === void 0 ? void 0 : _a[0];
            if (!file) {
                cleanup();
                return reject(new Error("no file selected"));
            }
            const reader = new FileReader();
            reader.onload = () => {
                cleanup();
                if (typeof reader.result === "string") {
                    resolve(reader.result);
                }
                else {
                    reject(new Error("failed to read file as a string"));
                }
            };
            reader.onerror = () => {
                cleanup();
                reject(new Error("failed to read file"));
            };
            reader.readAsText(file);
        });
        input.click();
        function cleanup() {
            input.remove();
        }
    });
}
function save_text_as_file(filename, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    // append, trigger click, clean up
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
/// <reference path="utils.ts" />
function create_shader(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error(`failed to create empty shader of type ${type}`);
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, WebGL2RenderingContext.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader) || "(no info)";
        throw new Error(`failed to compile shader of type ${type}: ${info}`);
    }
    return shader;
}
function create_program(gl, vertex_source, fragment_source) {
    const program = gl.createProgram();
    const vs = create_shader(gl, WebGL2RenderingContext.VERTEX_SHADER, vertex_source);
    const fs = create_shader(gl, WebGL2RenderingContext.FRAGMENT_SHADER, fragment_source);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, WebGL2RenderingContext.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program) || "(no info)";
        throw new Error(`failed to link graphics program: ${info}`);
    }
    return program;
}
// example dimensions: 1f (float), 3i (ivec3), basically the suffix after
// "gl.uniform".
function set_uniform(gl, program, name, value) {
    const location = gl.getUniformLocation(program, name);
    if (!location) {
        return false;
    }
    if (typeof value === "number") {
        gl.uniform1f(location, value);
    }
    else if (value instanceof Vec2) {
        gl.uniform2f(location, value.x, value.y);
    }
    else if (value instanceof Vec3) {
        gl.uniform3f(location, value.x, value.y, value.z);
    }
    else {
        throw new Error("unsupported uniform type");
    }
    return true;
}
function slider_create(min, max, step, value) {
    let slider_wrapper = document.createElement("div");
    slider_wrapper.className = "control slider-wrapper";
    let input = slider_wrapper.appendChild(document.createElement("input"));
    input.className = "slider-input";
    input.type = "range";
    input.min = min.toString();
    input.max = max.toString();
    input.step = step.toString();
    input.value = value.toString();
    let indicator = slider_wrapper.appendChild(document.createElement("div"));
    indicator.className = "slider-indicator";
    let show_indicator = () => indicator.classList.add("slider-indicator-show");
    let hide_indicator = () => indicator.classList.remove("slider-indicator-show");
    input.addEventListener("mouseenter", show_indicator);
    input.addEventListener("pointerenter", show_indicator);
    input.addEventListener("mousedown", show_indicator);
    input.addEventListener("pointerdown", show_indicator);
    input.addEventListener("mouseup", hide_indicator);
    input.addEventListener("pointerup", hide_indicator);
    input.addEventListener("mouseleave", hide_indicator);
    input.addEventListener("pointerleave", hide_indicator);
    return slider_wrapper;
}
function slider_get_input(elem) {
    return elem.getElementsByTagName("input")[0];
}
function slider_get_indicator(elem) {
    return elem.getElementsByTagName("div")[0];
}
/// <reference path="utils.ts" />
/// <reference path="ui.ts" />
function get_value_type(v) {
    if (typeof v === "number") {
        return "number";
    }
    else if (v instanceof Vec2) {
        return "Vec2";
    }
    else {
        throw new Error("unsupported value type");
    }
}
class Param {
    constructor(id, name, value, element = null, change_event = null, render_event = null, config = {}) {
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
    id() {
        return this._id;
    }
    name() {
        return this._name;
    }
    set_name(new_name) {
        this._name = new_name;
        this.render_from_scratch();
    }
    element() {
        return this._element;
    }
    set_element(new_element) {
        this._element = new_element;
    }
    change_event() {
        return this._change_event;
    }
    set_change_event(new_event) {
        this._change_event = new_event;
    }
    render_event() {
        return this._render_event;
    }
    set_render_event(new_event) {
        this._render_event = new_event;
    }
    config() {
        return this._config;
    }
    set_config(new_config) {
        this._config = deep_clone(new_config);
    }
    get() {
        return this._value;
    }
    set(new_value, invoke_change_event = false) {
        if (typeof new_value !== typeof this._value) {
            throw new Error("can't change parameter's value type after it's been " +
                "constructed.");
        }
        const old_value = deep_clone(this._value);
        this._value = deep_clone(new_value);
        if (invoke_change_event && this._change_event !== null) {
            this._change_event(this, old_value, this._value, true);
        }
        this.render();
    }
    number_to_str(v) {
        let s_value;
        if (typeof this._config.decimal_digits === "number") {
            s_value = v.toFixed(this._config.decimal_digits);
        }
        else {
            s_value = v.toString();
        }
        let unit_str = "";
        if (typeof (this._config.value_unit) === "string") {
            unit_str = " " + this._config.value_unit;
        }
        return s_value + unit_str;
    }
    render_from_scratch() {
        if (this._element === null) {
            return;
        }
        let elem = document.createElement("div");
        elem.id = this._element.id;
        elem.toggleAttribute("has-ever-rendered", true);
        elem.className = "control-container";
        let label = elem.appendChild(document.createElement("div"));
        label.className = "control-label";
        label.textContent = this._name;
        if (typeof this._value === "number") {
            let slider = elem.appendChild(slider_create((this._config.min || 0.), (this._config.max || 1.), (this._config.step || .001), this._value));
            let indicator = slider_get_indicator(slider);
            indicator.innerHTML = this.number_to_str(this._value);
            let input = slider_get_input(slider);
            input.addEventListener("input", () => {
                const old_value = deep_clone(this._value);
                this._value = parseFloat(input.value);
                indicator.innerHTML = this.number_to_str(this._value);
                if (this._change_event !== null) {
                    this._change_event(this, old_value, this._value, false);
                }
            });
        }
        else if (this._value instanceof Vec2) {
            // x
            {
                let slider = elem.appendChild(slider_create((this._config.min || 0.), (this._config.max || 1.), (this._config.step || .001), this._value.x));
                slider.style.marginInlineEnd = "0.1rem";
                let indicator = slider_get_indicator(slider);
                indicator.innerHTML = this.number_to_str(this._value.x);
                let input = slider_get_input(slider);
                input.addEventListener("input", () => {
                    if (!(this._value instanceof Vec2)) {
                        throw new Error("value type has changed!");
                    }
                    const old_value = deep_clone(this._value);
                    this._value.x = parseFloat(input.value);
                    indicator.innerHTML = this.number_to_str(this._value.x);
                    if (this._change_event !== null) {
                        this._change_event(this, old_value, this._value, false);
                    }
                });
            }
            // y
            {
                let slider = elem.appendChild(slider_create((this._config.min || 0.), (this._config.max || 1.), (this._config.step || .001), this._value.y));
                slider.style.marginInlineStart = "0.1rem";
                let indicator = slider_get_indicator(slider);
                indicator.innerHTML = this.number_to_str(this._value.y);
                let input = slider_get_input(slider);
                input.addEventListener("input", () => {
                    if (!(this._value instanceof Vec2)) {
                        throw new Error("value type has changed!");
                    }
                    const old_value = deep_clone(this._value);
                    this._value.y = parseFloat(input.value);
                    indicator.innerHTML = this.number_to_str(this._value.y);
                    if (this._change_event !== null) {
                        this._change_event(this, old_value, this._value, false);
                    }
                });
            }
        }
        else {
            throw new Error("unsupported value type");
        }
        this._element.replaceWith(elem);
        this._element = elem;
        if (this._render_event !== null) {
            this._render_event(this);
        }
    }
    render() {
        if (this._element === null) {
            return;
        }
        if (!this._element.hasAttribute("has-ever-rendered")) {
            this.render_from_scratch();
            return;
        }
        if (typeof this._value === "number") {
            let slider = this._element.getElementsByClassName("slider-wrapper")[0];
            slider_get_input(slider).value = this._value.toString();
            slider_get_indicator(slider).innerHTML =
                this.number_to_str(this._value);
        }
        else if (this._value instanceof Vec2) {
            let slider_x = this._element.getElementsByClassName("slider-wrapper")[0];
            let slider_y = this._element.getElementsByClassName("slider-wrapper")[1];
            slider_get_input(slider_x).value = this._value.x.toString();
            slider_get_input(slider_y).value = this._value.y.toString();
            slider_get_indicator(slider_x).innerHTML =
                this.number_to_str(this._value.x);
            slider_get_indicator(slider_y).innerHTML =
                this.number_to_str(this._value.y);
        }
        else {
            throw new Error("unsupported value type");
        }
        if (this._render_event !== null) {
            this._render_event(this);
        }
    }
}
class ParamList {
    constructor() {
        this.params = [];
    }
    add(new_param) {
        for (const param of this.params) {
            if (param.id() === new_param.id()) {
                throw new Error("another parameter with the same ID is already in the list");
            }
        }
        this.params.push(new_param);
        new_param.render();
    }
    get(id) {
        for (const param of this.params) {
            if (param.id() === id) {
                return param;
            }
        }
        return null;
    }
    render_all() {
        for (const param of this.params) {
            param.render();
        }
    }
    serialize() {
        let data = {};
        for (const param of this.params) {
            data[param.id()] = {
                type: get_value_type(param.get()),
                value: param.get()
            };
        }
        return JSON.stringify(data);
    }
    deserialize(s_data, invoke_change_event = false) {
        let data = JSON.parse(s_data);
        for (const key in data) {
            if (!data.hasOwnProperty(key)) {
                continue;
            }
            let param = this.get(key);
            if (param === null) {
                console.warn("data contains a parameter ID that doesn't currently exist");
                continue;
            }
            let elem = data[key];
            if (get_value_type(param.get()) !== elem.type) {
                throw new Error("data has a different value type");
            }
            if (typeof param.get() === "number") {
                param.set(elem.value, invoke_change_event);
            }
            else if (param.get() instanceof Vec2) {
                param.set(new Vec2(elem.value.x, elem.value.y));
            }
            else {
                throw new Error("unsupported value type");
            }
        }
    }
}
/// <reference path="utils.ts" />
/// <reference path="params.ts" />
/// <reference path="gl.ts" />
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
    for (const param of default_params) {
        param_list.get(param.id()).set(param.get());
    }
    render_canvas();
}
function init() {
    // events
    document.getElementById("btn-hide").addEventListener("click", () => {
        document.getElementById("controls").classList.add("hide");
        document.getElementById("canvas").classList.remove("untouchable");
    });
    document.getElementById("canvas").addEventListener("click", () => {
        document.getElementById("controls").classList.remove("hide");
        document.getElementById("canvas").classList.add("untouchable");
    });
    document.getElementById("btn-reset-all").addEventListener("click", () => {
        reset_params();
    });
    document.getElementById("btn-import").addEventListener("click", () => {
        import_params();
    });
    document.getElementById("btn-export").addEventListener("click", () => {
        export_params();
    });
    // add parameters
    param_list.add(new Param("tile_size", "Tile Size", new Vec2(200., 400.), "use-id", () => render_canvas(), null, { min: 10., max: 1000., step: 1., value_unit: "px", decimal_digits: 0 }));
    param_list.add(new Param("border_thickness", "Border Thickness", 3., "use-id", () => render_canvas(), null, { min: 0., max: 20., step: .25, value_unit: "px", decimal_digits: 2 }));
    param_list.add(new Param("grid_lines_density", "Density", 400., "use-id", () => render_canvas(), null, { min: 1., max: 2000., step: 1., decimal_digits: 0 }));
    param_list.add(new Param("grid_lines_thickness", "Thickness", 1., "use-id", () => render_canvas(), null, { min: 0., max: 20., step: .25, value_unit: "px", decimal_digits: 2 }));
    param_list.add(new Param("grid_lines_opacity_horizontal", "Horizontal Lines", 0., "use-id", () => render_canvas(), null, { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("grid_lines_opacity_vertical", "Vertical Lines", .05, "use-id", () => render_canvas(), null, { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("masjad_position", "Position", .125, "use-id", () => render_canvas(), null, { min: 0., max: .5, step: .001, decimal_digits: 2 }));
    param_list.add(new Param("masjad_radius", "Radius", .05, "use-id", () => render_canvas(), null, { min: 0., max: .5, step: .001, decimal_digits: 2 }));
    param_list.add(new Param("feet_vertical_position", "Position", .2, "use-id", () => render_canvas(), null, { min: 0., max: .5, step: .001, decimal_digits: 2 }));
    param_list.add(new Param("feet_horizontal_distance", "Distance", .12, "use-id", () => render_canvas(), null, { min: 0., max: .3, step: .001, decimal_digits: 2 }));
    param_list.add(new Param("feet_thickness", "Thickness", 1., "use-id", () => render_canvas(), null, { min: 0., max: 20., step: .25, value_unit: "px", decimal_digits: 2 }));
    param_list.add(new Param("feet_opacity", "Opacity", 1., "use-id", () => render_canvas(), null, { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("feet_size", "Size", new Vec2(.05, .13), "use-id", () => render_canvas(), null, { min: 0., max: .3, step: .001, decimal_digits: 2 }));
    param_list.add(new Param("transform_scale", "Scale", new Vec2(1., 1.), "use-id", () => render_canvas(), null, { min: .1, max: 3., step: .001, decimal_digits: 3 }));
    param_list.add(new Param("transform_skew", "Skew", new Vec2(0., 0.), "use-id", () => render_canvas(), null, { min: -1., max: 1., step: .001, decimal_digits: 3 }));
    param_list.add(new Param("transform_rotation", "Rotation", 0., "use-id", () => render_canvas(), null, { min: -180., max: 180., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("transform_offset", "Offset", new Vec2(0., 0.), "use-id", () => render_canvas(), null, { min: -200., max: 200., step: .25, value_unit: "px", decimal_digits: 2 }));
    param_list.add(new Param("background_color_h", "Hue", 0., "use-id", () => { update_color_blobs(); render_canvas(); }, () => update_color_blobs(), { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("background_color_s", "Saturation", 0., "use-id", () => { update_color_blobs(); render_canvas(); }, () => update_color_blobs(), { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("background_color_v", "Value", 0., "use-id", () => { update_color_blobs(); render_canvas(); }, () => update_color_blobs(), { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("pattern_color_h", "Hue", 0., "use-id", () => { update_color_blobs(); render_canvas(); }, () => update_color_blobs(), { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("pattern_color_s", "Saturation", 0., "use-id", () => { update_color_blobs(); render_canvas(); }, () => update_color_blobs(), { min: 0., max: 1., step: .001, decimal_digits: 2 }));
    param_list.add(new Param("pattern_color_v", "Value", 1., "use-id", () => { update_color_blobs(); render_canvas(); }, () => update_color_blobs(), { min: 0., max: 1., step: .001, decimal_digits: 2 }));
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
    let background_color = view_transform(hsv_to_rgb([
        (((_a = param_list.get("background_color_h")) === null || _a === void 0 ? void 0 : _a.get()) || 0.),
        (((_b = param_list.get("background_color_s")) === null || _b === void 0 ? void 0 : _b.get()) || 0.),
        (((_c = param_list.get("background_color_v")) === null || _c === void 0 ? void 0 : _c.get()) || 0.)
    ]));
    let pattern_color = view_transform(hsv_to_rgb([
        (((_d = param_list.get("pattern_color_h")) === null || _d === void 0 ? void 0 : _d.get()) || 0.),
        (((_e = param_list.get("pattern_color_s")) === null || _e === void 0 ? void 0 : _e.get()) || 0.),
        (((_f = param_list.get("pattern_color_v")) === null || _f === void 0 ? void 0 : _f.get()) || 0.)
    ]));
    document.getElementById("background_color_blob").style.backgroundColor =
        `rgb(${background_color.join(", ")})`;
    document.getElementById("pattern_color_blob").style.backgroundColor =
        `rgb(${pattern_color.join(", ")})`;
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
    const dpr = window.devicePixelRatio || 1;
    state.canvas.width = Math.floor(document.body.clientWidth * dpr);
    state.canvas.height = Math.floor(document.body.clientHeight * dpr);
    state.gl.viewport(0, 0, state.canvas.width, state.canvas.height);
    // high DPI nonsense
    state.canvas.style.width = `${Math.floor(state.canvas.width / dpr)}px`;
    state.canvas.style.height = `${Math.floor(state.canvas.height / dpr)}px`;
    // vertex shader
    const vertex_source = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
    v_uv = (a_position + 1.) * .5;
    gl_Position = vec4(a_position, 0., 1.);
}
`;
    // fragment shader
    const fragment_source = `#version 300 es

precision highp float;
precision highp int;

in vec2 v_uv;
out vec4 out_color;

// render resolution
uniform vec2 res;

// tile
uniform vec2 tile_size; // px
uniform float border_thickness; // px

// grid lines
uniform float grid_lines_density;
uniform float grid_lines_thickness; // px
uniform float grid_lines_opacity_horizontal;
uniform float grid_lines_opacity_vertical;

// masjad
uniform float masjad_position; // 0 = top, 1 = bottom
uniform float masjad_radius; // relative to tile size

// feet
uniform float feet_vertical_position; // 0 = bottom, 1 = top
uniform float feet_horizontal_distance; // relative to tile size
uniform vec2 feet_size; // relative to tile size
uniform float feet_thickness; // px
uniform float feet_opacity;

// transform
uniform vec2 transform_scale;
uniform vec2 transform_skew;
uniform float transform_rotation; // degrees
uniform vec2 transform_offset; // px

// colors
uniform vec3 background_color;
uniform vec3 pattern_color;

/*__________ hash function collection _________*/
// sources: https://nullprogram.com/blog/2018/07/31/
//          https://www.shadertoy.com/view/WttXWX

uint triple32(uint x)
{
    x ^= x >> 17;
    x *= 0xed5ad4bbU;
    x ^= x >> 11;
    x *= 0xac4c1b51U;
    x ^= x >> 15;
    x *= 0x31848babU;
    x ^= x >> 14;
    return x;
}

// uint -> uint

uint hash(uint v)
{
    return triple32(v);
}

uint hash(uvec2 v)
{
    return triple32(v.x + triple32(v.y));
}

uint hash(uvec3 v)
{
    return triple32(v.x + triple32(v.y + triple32(v.z)));
}

uint hash(uvec4 v)
{
    return triple32(v.x + triple32(v.y + triple32(v.z + triple32(v.w))));
}

// int -> uint

uint hash(int v)
{
    return triple32(uint(v));
}

uint hash(ivec2 v)
{
    return triple32(uint(v.x) + triple32(uint(v.y)));
}

uint hash(ivec3 v)
{
    return triple32(uint(v.x) + triple32(uint(v.y) + triple32(uint(v.z))));
}

uint hash(ivec4 v)
{
    return triple32(uint(v.x) + triple32(uint(v.y) + triple32(uint(v.z) + triple32(uint(v.w)))));
}

// float -> uint

uint hash(float v)
{
    return triple32(floatBitsToUint(v));
}

uint hash(vec2 v)
{
    return triple32(floatBitsToUint(v.x) + triple32(floatBitsToUint(v.y)));
}

uint hash(vec3 v)
{
    return triple32(floatBitsToUint(v.x) + triple32(floatBitsToUint(v.y) + triple32(floatBitsToUint(v.z))));
}

uint hash(vec4 v)
{
    return triple32(floatBitsToUint(v.x) + triple32(floatBitsToUint(v.y) + triple32(floatBitsToUint(v.z) + triple32(floatBitsToUint(v.w)))));
}

// any -> int
#define hashi(v) int(hash(v))

// any -> float
#define hashf(v) (float(hash(v)) / 4294967295.)

/*____________________ end ____________________*/

#define inv_step(a, b) (step(b, a))

mat2 rotate_2d(float angle)
{
    float s = sin(angle);
    float c = cos(angle);
    return mat2(
        c, s,
        -s, c
    );
}

// ellipse signed distance
// source (minor tweaks): https://www.shadertoy.com/view/4sS3zz
float msign(in float x) { return (x<0.0)?-1.0:1.0; }
float sd_ellipse(vec2 p, vec2 ab)
{
  //if( ab.x==ab.y ) return length(p)-ab.x;

    float aspect_ratio = ab.y / ab.x;
    if (abs(aspect_ratio - 1.) < .001)
    {
        return length(p) - ab.x;
    }

	p = abs( p ); 
    if( p.x>p.y ){ p=p.yx; ab=ab.yx; }
	
	float l = ab.y*ab.y - ab.x*ab.x;
    float m = ab.x*p.x/l; float m2 = m*m;
	float n = ab.y*p.y/l; float n2 = n*n;
    float c = (m2+n2-1.0)/3.0; float c2 = c*c; float c3 = c*c2;
    float d = c3 + m2*n2;
    float q = d  + m2*n2;
    float g = m  + m *n2;

    float co;

    if( d<0.0 )
    {
        float h = acos(q/c3)/3.0;
        float s = cos(h); s += 2.0;
        float t = sin(h); t *= sqrt(3.0);
        float rx = sqrt( m2-c*(s+t) );
        float ry = sqrt( m2-c*(s-t) );
        co = ry + sign(l)*rx + abs(g)/(rx*ry);
    }
    else                                    // d>0
    {                                       // q>0
        float h = 2.0*m*n*sqrt(d);          // h>0
        float s = pow(q+h, 1.0/3.0 );       // s>0
        float t = c2/s;                     // t>0
        float rx = -(s+t) - c*4.0 + 2.0*m2;
        float ry =  (s-t)*sqrt(3.0);
        float rm = sqrt( rx*rx + ry*ry );
        co = ry/sqrt(rm-rx) + 2.0*g/rm;
    }
    co = (co-m)/2.0;

    float si = sqrt( max(1.0-co*co,0.0) );
 
    vec2 r = ab * vec2(co,si);
	
    return length(r-p) * msign(p.y-r.y);
}

vec3 render(vec2 coord)
{
    // center coord
    coord -= (res * .5);

    // transform (remember RORO: reverse order, reverse operation)
    coord -= transform_offset;
    coord *= rotate_2d(-radians(transform_rotation));
    coord.x -= transform_skew.x * coord.y;
    coord.y -= transform_skew.y * coord.x;
    coord /= transform_scale;

    // 2D index of the current tile
    ivec2 itile = ivec2(floor(coord / tile_size));

    // pixel position relative to the current tile's bottom left corner
    vec2 tile_coord = mod(coord, tile_size);
    
    // use sqrt(tile area) as a reference to scale elements
    float overall_scale = sqrt(tile_size.x * tile_size.y);

    float v = 0.;

    // border
    {
        float half_thickness = border_thickness * .5;
        float half_tile_w = tile_size.x * .5;
        float half_tile_h = tile_size.y * .5;
        v = max(
            inv_step(
                abs(tile_coord.x - half_tile_w),
                half_tile_w - half_thickness
            ),
            inv_step(
                abs(tile_coord.y - half_tile_h),
                half_tile_h - half_thickness
            )
        );
    }
    
    // grid lines
    {
        float grid_lines_res_x = max(
            ceil(sqrt(
                grid_lines_density * tile_size.x / tile_size.y
            )),
            1.
        );
        float grid_lines_res_y = max(
            ceil(grid_lines_density / float(grid_lines_res_x)),
            1.
        );

        vec2 grid_cell_size =
            tile_size / vec2(grid_lines_res_x, grid_lines_res_y);

        float half_thickness = grid_lines_thickness * .5;
        float half_cell_w = grid_cell_size.x * .5;
        float half_cell_h = grid_cell_size.y * .5;

        // vertical lines
        v = max(
            v,
            inv_step(
                abs(mod(tile_coord.x, grid_cell_size.x) - half_cell_w),
                half_cell_w - half_thickness
            ) * grid_lines_opacity_vertical
        );

        // horizontal lines
        v = max(
            v,
            inv_step(
                abs(mod(tile_coord.y, grid_cell_size.y) - half_cell_h),
                half_cell_h - half_thickness
            ) * grid_lines_opacity_horizontal
        );
    }

    // masjad
    {
        vec2 circle_center = vec2(
            tile_size.x * .5,
            tile_size.y * (1. - masjad_position)
        );
        float circle_radius = masjad_radius * overall_scale;

        float sd = distance(tile_coord, circle_center) - circle_radius;
        v = max(v, step(sd, 0.));
    }

    // feet
    {
        vec2 left_ellipse_center = vec2(
            tile_size.x * .5 - (feet_horizontal_distance * overall_scale),
            tile_size.y * feet_vertical_position
        );

        vec2 right_ellipse_center = vec2(
            tile_size.x * .5 + (feet_horizontal_distance * overall_scale),
            tile_size.y * feet_vertical_position
        );

        vec2 ellipse_radius = feet_size * overall_scale;
        float half_thickness = feet_thickness * .5;

        float sd = min(
            abs(sd_ellipse(
                tile_coord - left_ellipse_center,
                ellipse_radius
            )) - half_thickness,
            abs(sd_ellipse(
                tile_coord - right_ellipse_center,
                ellipse_radius
            )) - half_thickness
        );

        v = max(v, step(sd, 0.) * feet_opacity);
    }

    // colorize and return
    return mix(
        background_color,
        pattern_color,
        v
    );
}

vec3 view_transform(vec3 col)
{
    // OETF (Linear BT.709 -> sRGB 2.2)
    return pow(clamp(col, 0., 1.), vec3(1. / 2.2));
}

void main()
{
    // current pixel position
    vec2 frag_coord = gl_FragCoord.xy;

    // render (average multiple samples)
    vec3 col = vec3(0);
    const int N_SAMPLES = 32;
    for (int i = 0; i < N_SAMPLES; i++)
    {
        vec2 jitter_offs = vec2(
            hashf(ivec4(ivec2(floor(frag_coord)), i, 0)),
            hashf(ivec4(ivec2(floor(frag_coord)), i, 1))
        ) - .5;
        
        col += render(frag_coord + jitter_offs);
    }
    col /= float(N_SAMPLES);
    
    // output
    col = view_transform(col);
    out_color = vec4(col, 1);
}
`;
    try {
        // create graphics program (pipeline)
        state.program = create_program(state.gl, vertex_source, fragment_source);
        // fullscreen quad [-1, -1] to [1, 1]
        const quad_verts = new Float32Array([
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
        const position_loc = state.gl.getAttribLocation(state.program, "a_position");
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
        set_uniform(state.gl, state.program, "res", new Vec2(state.canvas.width, state.canvas.height));
        // ordinary parameters
        for (const param of param_list.params) {
            if (typeof param.get() === "number"
                || param.get() instanceof Vec2
                || param.get() instanceof Vec3) {
                set_uniform(state.gl, state.program, param.id(), param.get());
            }
        }
        // colors
        let background_color = hsv_to_rgb([
            param_list.get("background_color_h").get(),
            param_list.get("background_color_s").get(),
            param_list.get("background_color_v").get()
        ]);
        let pattern_color = hsv_to_rgb([
            param_list.get("pattern_color_h").get(),
            param_list.get("pattern_color_s").get(),
            param_list.get("pattern_color_v").get()
        ]);
        set_uniform(state.gl, state.program, "background_color", arr_to_vec3(background_color));
        set_uniform(state.gl, state.program, "pattern_color", arr_to_vec3(pattern_color));
    }
    // bind VBO
    state.gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, state.vbo);
    // draw
    state.gl.clearColor(0, 0, 0, 1);
    state.gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT);
    state.gl.drawArrays(WebGL2RenderingContext.TRIANGLES, 0, 6);
}
const param_json_prefix = "prayer pattern data\n";
function import_params() {
    load_text_from_file()
        .then(text => {
        if (!text.startsWith(param_json_prefix)) {
            console.error("incorrect data");
            return;
        }
        text = text.slice(param_json_prefix.length);
        param_list.deserialize(text);
        render_canvas();
    })
        .catch(err => {
        console.error(err);
    });
}
function export_params() {
    save_text_as_file("pattern.json", param_json_prefix + param_list.serialize());
}
