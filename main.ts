interface Dictionary {
    [key: string]: any;
}

interface Vec2 {
    x: number;
    y: number;
}

class Param {
    id: string;
    name: string;
    element: HTMLElement | null;

    constructor(
        id: string,
        name: string,
        element: HTMLElement | "use-id" | null
    ) {
        this.id = id;
        this.name = name;
        if (element === "use-id") {
            this.element = document.getElementById(this.id);
        } else {
            this.element = element;
        }
    }

    render() {
        console.log(
            "you're supposed to call render() on derived classes of Param, " +
            "not Param itself"
        );
    }
}

type ParamListener<ParamType, ValueType> =
    (param: ParamType, old_value: ValueType, new_value: ValueType) => void;

class StringParam extends Param {
    value: string;
    listener: ParamListener<StringParam, string> | null;

    constructor(
        id: string,
        name: string,
        element: HTMLElement | "use-id" | null,
        value: string,
        listener: ParamListener<StringParam, string> | null
    ) {
        super(id, name, element);
        this.value = value;
        this.listener = listener;
    }

    render() {
        if (this.element === null) {
            return;
        }
        throw new Error("not yet implemented");
    }
}

class NumberParam extends Param {
    value: number;
    min: number;
    max: number;
    step: number;
    listener: ParamListener<NumberParam, number> | null;

    private has_ever_rendered: boolean = false;

    constructor(
        id: string,
        name: string,
        element: HTMLElement | "use-id" | null,
        value: number,
        min: number,
        max: number,
        step: number,
        listener: ParamListener<NumberParam, number> | null
    ) {
        super(id, name, element);
        this.value = value;
        this.min = min;
        this.max = max;
        this.step = step;
        this.listener = listener;
    }

    render_from_scratch() {
        if (this.element === null) {
            return;
        }

        let elem = document.createElement("div");
        elem.toggleAttribute("has-ever-rendered", true);
        elem.className = "control-container";

        let label = elem.appendChild(document.createElement("div"));
        label.className = "control-label";
        label.textContent = this.name;

        let input = elem.appendChild(document.createElement("input"));
        input.className = "control";
        input.type = "range";
        input.min = this.min.toString();
        input.max = this.max.toString();
        input.step = this.step.toString();
        input.value = this.value.toString();
        input.addEventListener("input", () => {
            const old_value = structuredClone(this.value);
            this.value = parseFloat(input.value);

            if (this.listener !== null) {
                this.listener(this, old_value, this.value);
            }
        });

        this.element.replaceWith(elem);
    }

    render() {
        if (this.element === null) {
            return;
        }

        if (!this.element.hasAttribute("has-ever-rendered")) {
            this.render_from_scratch();
        } else {
            let input = this.element.getElementsByTagName("input")[0];
            input.value = this.value.toString();
        }
    }
}

class Vec2Param extends Param {
    value: Vec2;
    min: number;
    max: number;
    step: number;
    listener: ParamListener<Vec2Param, Vec2> | null;

    constructor(
        id: string,
        name: string,
        element: HTMLElement | "use-id" | null,
        value: Vec2,
        min: number,
        max: number,
        step: number,
        listener: ParamListener<Vec2Param, Vec2> | null
    ) {
        super(id, name, element);
        this.value = value;
        this.min = min;
        this.max = max;
        this.step = step;
        this.listener = listener;
    }

    render_from_scratch() {
        if (this.element === null) {
            return;
        }

        let elem = document.createElement("div");
        elem.toggleAttribute("has-ever-rendered", true);
        elem.className = "control-container";

        let label = elem.appendChild(document.createElement("div"));
        label.className = "control-label";
        label.textContent = this.name;

        let input_x = elem.appendChild(document.createElement("input"));
        input_x.className = "control";
        input_x.type = "range";
        input_x.min = this.min.toString();
        input_x.max = this.max.toString();
        input_x.step = this.step.toString();
        input_x.value = this.value.toString();
        input_x.addEventListener("input", () => {
            const old_value = structuredClone(this.value);
            this.value.x = parseFloat(input_x.value);

            if (this.listener !== null) {
                this.listener(this, old_value, this.value);
            }
        });

        let input_y = elem.appendChild(document.createElement("input"));
        input_y.className = "control";
        input_y.type = "range";
        input_y.min = this.min.toString();
        input_y.max = this.max.toString();
        input_y.step = this.step.toString();
        input_y.value = this.value.toString();
        input_y.addEventListener("input", () => {
            const old_value = structuredClone(this.value);
            this.value.y = parseFloat(input_y.value);

            if (this.listener !== null) {
                this.listener(this, old_value, this.value);
            }
        });

        this.element.replaceWith(elem);
    }

    render() {
        if (this.element === null) {
            return;
        }

        if (!this.element.hasAttribute("has-ever-rendered")) {
            this.render_from_scratch();
        } else {
            let inputs = this.element.getElementsByTagName("input");
            inputs[0].value = this.value.x.toString();
            inputs[1].value = this.value.y.toString();
        }
    }
}

class ParamList {
    params: Array<Param>;

    constructor() {
        this.params = [];
    }

    add(new_param: Param) {
        for (const param of this.params) {
            if (param.id == new_param.id) {
                throw new Error(
                    "another parameter with the same ID is already in the list"
                );
            }
        }

        this.params.push(new_param);
        new_param.render();
    }

    get(id: string): Param | null {
        for (const param of this.params) {
            if (param.id === id) {
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
}

var state = {};
var param_list = new ParamList();
param_list.add(new Vec2Param(
    "tile_size",
    "Tile Size",
    "use-id",
    { x: 200., y: 400. },
    10.,
    1000.,
    1.,
    () => render_canvas()
));
param_list.add(new NumberParam(
    "border_thickness",
    "Border Thickness",
    "use-id",
    3.,
    0.,
    20.,
    .25,
    () => render_canvas()
));
param_list.add(new NumberParam(
    "grid_lines_density",
    "Density",
    "use-id",
    200.,
    1.,
    2000.,
    1.,
    () => render_canvas()
));
param_list.add(new NumberParam(
    "grid_lines_thickness",
    "Thickness",
    "use-id",
    1.,
    0.,
    20.,
    .25,
    () => render_canvas()
));
param_list.add(new NumberParam(
    "grid_lines_opacity_horizontal",
    "Horizontal Lines",
    "use-id",
    0.,
    0.,
    1.,
    .001,
    () => render_canvas()
));
param_list.add(new NumberParam(
    "grid_lines_opacity_vertical",
    "Vertical Lines",
    "use-id",
    .05,
    0.,
    1.,
    .001,
    () => render_canvas()
));


param_list.add(new NumberParam(
    "masjad_position",
    "Position",
    "use-id",
    .125,
    0.,
    .5,
    .001,
    () => render_canvas()
));
param_list.add(new NumberParam(
    "masjad_radius",
    "Radius",
    "use-id",
    .05,
    0.,
    .5,
    .001,
    () => render_canvas()
));
param_list.add(new NumberParam(
    "feet_vertical_position",
    "Position",
    "use-id",
    .2,
    0.,
    .5,
    .001,
    () => render_canvas()
));
param_list.add(new NumberParam(
    "feet_horizontal_distance",
    "Distance",
    "use-id",
    .12,
    0.,
    .3,
    .001,
    () => render_canvas()
));
param_list.add(new Vec2Param(
    "feet_size",
    "Size",
    "use-id",
    { x: .05, y: .13 },
    0.,
    .3,
    .001,
    () => render_canvas()
));
param_list.add(new Vec2Param(
    "transform_scale",
    "Scale",
    "use-id",
    { x: 1., y: 1. },
    .1,
    3.,
    .001,
    () => render_canvas()
));
param_list.add(new Vec2Param(
    "transform_skew",
    "Skew",
    "use-id",
    { x: 0., y: 0. },
    -1.,
    1.,
    .001,
    () => render_canvas()
));
param_list.add(new NumberParam(
    "transform_rotation",
    "Rotation",
    "use-id",
    0.,
    -180.,
    180.,
    .001,
    () => render_canvas()
));
param_list.add(new Vec2Param(
    "transform_offset",
    "Offset",
    "use-id",
    { x: 0., y: 0. },
    -200.,
    200.,
    .25,
    () => render_canvas()
));
param_list.add(new NumberParam(
    "background_color_h",
    "Hue",
    "use-id",
    0.,
    0.,
    1.,
    .001,
    () => render_canvas()
));
param_list.add(new NumberParam(
    "background_color_s",
    "Saturation",
    "use-id",
    0.,
    0.,
    1.,
    .001,
    () => render_canvas()
));
param_list.add(new NumberParam(
    "background_color_v",
    "Value",
    "use-id",
    0.,
    0.,
    1.,
    .001,
    () => render_canvas()
));
param_list.add(new NumberParam(
    "pattern_color_h",
    "Hue",
    "use-id",
    0.,
    0.,
    1.,
    .001,
    () => render_canvas()
));
param_list.add(new NumberParam(
    "pattern_color_s",
    "Saturation",
    "use-id",
    0.,
    0.,
    1.,
    .001,
    () => render_canvas()
));
param_list.add(new NumberParam(
    "pattern_color_v",
    "Value",
    "use-id",
    1.,
    0.,
    1.,
    .001,
    () => render_canvas()
));

var default_params: Param[] = param_list.params.slice()

function reset_params() {
    for (const param of default_params){
        param_list.get(param.id)?.
    }
    param_list = Object.assign({}, _default_params);
    render();
}

function read_param_value(param_name, param_index = -1, element_id = null) {
    let elem = null;
    if (!element_id || element_id.length < 1) {
        elem = document.getElementById(param_name)
    }
    else {
        elem = document.getElementById(element_id);
    }

    if (!elem) {
        return;
    }

    if (param_index < 0) {
        param_list[param_name] = elem.value;
    } else {
        param_list[param_name][param_index] = elem.value;
    }
}

function params_changed() {
    read_param_value("tile_size", 0, "tile_size_x");
    read_param_value("tile_size", 1, "tile_size_y");
    read_param_value("border_thickness");

    read_param_value("grid_lines_density");
    read_param_value("grid_lines_thickness");
    read_param_value("grid_lines_opacity_horizontal");
    read_param_value("grid_lines_opacity_vertical");

    read_param_value("masjad_position");
    read_param_value("masjad_radius");

    read_param_value("feet_vertical_position");
    read_param_value("feet_horizontal_distance");
    read_param_value("feet_size", 0, "feet_size_x");
    read_param_value("feet_size", 1, "feet_size_y");
    read_param_value("feet_thickness");
    read_param_value("feet_opacity");

    read_param_value("transform_scale", 0, "transform_scale_x");
    read_param_value("transform_scale", 1, "transform_scale_y");
    read_param_value("transform_skew", 0, "transform_skew_x");
    read_param_value("transform_skew", 1, "transform_skew_y");
    read_param_value("transform_rotation");
    read_param_value("transform_offset", 0, "transform_offset_x");
    read_param_value("transform_offset", 1, "transform_offset_y");

    read_param_value("background_color_hsv", 0, "background_color_h");
    read_param_value("background_color_hsv", 1, "background_color_s");
    read_param_value("background_color_hsv", 2, "background_color_v");
    read_param_value("pattern_color_hsv", 0, "pattern_color_h");
    read_param_value("pattern_color_hsv", 1, "pattern_color_s");
    read_param_value("pattern_color_hsv", 2, "pattern_color_v");

    let background_color = view_transform(hsv_to_rgb(param_list.background_color_hsv));
    let pattern_color = view_transform(hsv_to_rgb(param_list.pattern_color_hsv));
    document.getElementById("background_color_blob").style.backgroundColor =
        `rgb(${background_color.join(", ")})`;
    document.getElementById("pattern_color_blob").style.backgroundColor =
        `rgb(${pattern_color.join(", ")})`;

    render();
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
        document.getElementById("error-message").style.visibility = "visible";
        return;
    }

    // viewport resolution
    const dpr = window.devicePixelRatio || 1;
    state.canvas.width = Math.floor(document.body.clientWidth * dpr);
    state.canvas.height = Math.floor(document.body.clientHeight * dpr);
    state.gl.viewport(0, 0, canvas.width, canvas.height);

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

        float sd = min(
            abs(sd_ellipse(
                tile_coord - left_ellipse_center,
                ellipse_radius
            )) - feet_thickness,
            abs(sd_ellipse(
                tile_coord - right_ellipse_center,
                ellipse_radius
            )) - feet_thickness
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
        vec2 offs = vec2(
            hashf(ivec2(i, 10)),
            hashf(ivec2(i, 20))
        ) - .5;
        
        col += render(frag_coord + offs);
    }
    col /= float(N_SAMPLES);
    
    // output
    col = view_transform(col);
    out_color = vec4(col, 1);
}
`;

    // create graphics program (pipeline)
    state.program = create_program(vertex_source, fragment_source);

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
    state.gl.bindBuffer(state.gl.ARRAY_BUFFER, state.vbo);
    state.gl.bufferData(
        state.gl.ARRAY_BUFFER,
        quad_verts,
        state.gl.STATIC_DRAW
    );

    // define vertex attributes layout in the VBO
    const position_loc = state.gl.getAttribLocation(state.program, "a_position");
    state.gl.enableVertexAttribArray(position_loc);
    state.gl.vertexAttribPointer(position_loc, 2, state.gl.FLOAT, false, 0, 0);

    // update state
    state.canvas_ready = true;

    params_changed();
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
        set_uniform(state.program, "res", "2f", [state.canvas.width, state.canvas.height]);

        // tile
        set_uniform(state.program, "tile_size", "2f", param_list.tile_size);
        set_uniform(state.program, "border_thickness", "1f", param_list.border_thickness);

        // grid lines
        set_uniform(state.program, "grid_lines_density", "1f", param_list.grid_lines_density);
        set_uniform(state.program, "grid_lines_thickness", "1f", param_list.grid_lines_thickness);
        set_uniform(state.program, "grid_lines_opacity_horizontal", "1f", param_list.grid_lines_opacity_horizontal);
        set_uniform(state.program, "grid_lines_opacity_vertical", "1f", param_list.grid_lines_opacity_vertical);

        // masjad
        set_uniform(state.program, "masjad_position", "1f", param_list.masjad_position);
        set_uniform(state.program, "masjad_radius", "1f", param_list.masjad_radius);

        // feet
        set_uniform(state.program, "feet_vertical_position", "1f", param_list.feet_vertical_position);
        set_uniform(state.program, "feet_horizontal_distance", "1f", param_list.feet_horizontal_distance);
        set_uniform(state.program, "feet_size", "2f", param_list.feet_size);
        set_uniform(state.program, "feet_thickness", "1f", param_list.feet_thickness);
        set_uniform(state.program, "feet_opacity", "1f", param_list.feet_opacity);

        // transform
        set_uniform(state.program, "transform_scale", "2f", param_list.transform_scale);
        set_uniform(state.program, "transform_skew", "2f", param_list.transform_skew);
        set_uniform(state.program, "transform_rotation", "1f", param_list.transform_rotation);
        set_uniform(state.program, "transform_offset", "2f", param_list.transform_offset);

        // colors
        let background_color = hsv_to_rgb(param_list.background_color_hsv);
        let pattern_color = hsv_to_rgb(param_list.pattern_color_hsv);
        set_uniform(state.program, "background_color", "3f", background_color);
        set_uniform(state.program, "pattern_color", "3f", pattern_color);
    }

    // bind VBO
    state.gl.bindBuffer(state.gl.ARRAY_BUFFER, state.vbo);

    // draw
    state.gl.clearColor(0, 0, 0, 1);
    state.gl.clear(state.gl.COLOR_BUFFER_BIT);
    state.gl.drawArrays(state.gl.TRIANGLES, 0, 6);
}

function create_shader(type, source) {
    const shader = state.gl.createShader(type);
    if (!shader) {
        throw new Error(`failed to create empty shader of type ${type}`);
    }

    state.gl.shaderSource(shader, source);
    state.gl.compileShader(shader);
    if (!state.gl.getShaderParameter(shader, state.gl.COMPILE_STATUS)) {
        const info = state.gl.getShaderInfoLog(shader);
        throw new Error(`failed to compile shader of type ${type}: ${info}`);
    }

    return shader;
}

function create_program(vertex_source, fragment_source) {
    const vs = create_shader(state.gl.VERTEX_SHADER, vertex_source);
    const fs = create_shader(state.gl.FRAGMENT_SHADER, fragment_source);

    const program = state.gl.createProgram();
    if (!program) {
        throw new Error("failed to create empty graphics program");
    }

    state.gl.attachShader(program, vs);
    state.gl.attachShader(program, fs);
    state.gl.linkProgram(program);
    if (!state.gl.getProgramParameter(program, state.gl.LINK_STATUS)) {
        const info = state.gl.getProgramInfoLog(program);
        throw new Error(`failed to link graphics program: ${info}`);
    }

    return program;
}

// example dimensions: 1f (float), 3i (ivec3), basically the suffix after
// "gl.uniform".
function set_uniform(program, name, dimensions, value) {
    const location = state.gl.getUniformLocation(program, name);
    if (!location) {
        return false;
    }

    if (!state.gl[`uniform${dimensions}`]) {
        throw new RangeError(
            `invalid dimensions for shader uniform: "${dimensions}"`
        );
    }

    if (dimensions[0] === '1') {
        state.gl[`uniform${dimensions}`](location, value);
    }
    else if (dimensions[0] === '2') {
        state.gl[`uniform${dimensions}`](location, value[0], value[1]);
    }
    else if (dimensions[0] === '3') {
        state.gl[`uniform${dimensions}`](location, value[0], value[1], value[2]);
    }
    else if (dimensions[0] === '4') {
        state.gl[`uniform${dimensions}`](location, value[0], value[1], value[2], value[3]);
    }
    else {
        throw new RangeError(
            `invalid dimensions for shader uniform: "${dimensions}"`
        );
    }
    return true;
}

function clamp01(v) {
    return Math.min(Math.max(v, 0.), 1.);
}

function view_transform(rgb) {
    return rgb.map(v => Math.round(255. * Math.pow(clamp01(v), 1. / 2.2)));
}

// source (minor tweaks): https://stackoverflow.com/a/17243070
function hsv_to_rgb(hsv) {
    let h = clamp01(hsv[0]), s = clamp01(hsv[1]), v = clamp01(hsv[2]);
    let r = 0, g = 0, b = 0;
    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [r, g, b];
}
