interface Dictionary {
    [key: string]: unknown;
}

class Vec2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

class Vec3 {
    x: number;
    y: number;
    z: number;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

function arr_to_vec2(arr: number[]): Vec2 {
    if (arr.length != 2) {
        throw new Error("array must have exactly 2 elements");
    }
    return new Vec2(arr[0], arr[1]);
}

function arr_to_vec3(arr: number[]): Vec3 {
    if (arr.length != 3) {
        throw new Error("array must have exactly 3 elements");
    }
    return new Vec3(arr[0], arr[1], arr[2]);
}

type Value = number | Vec2;

type ParamChangeEvent = (
    param: Param,
    old_value: Value,
    new_value: Value,
    own_change: boolean // was the change caused by calling set()?
) => void;

type ParamRenderEvent = (param: Param) => void;

class Param {
    private readonly _id: string;
    private _name: string;
    private _value: Value;
    private _element: HTMLElement | null;
    private _change_event: ParamChangeEvent | null;
    private _render_event: ParamRenderEvent | null;
    private _config: Dictionary;

    constructor(
        id: string,
        name: string,
        value: Value,
        element: HTMLElement | "use-id" | null = null,
        change_event: ParamChangeEvent | null = null,
        render_event: ParamRenderEvent | null = null,
        config: Dictionary = {}
    ) {
        this._id = id;
        this._name = name;
        this._value = deep_clone(value);
        if (element === "use-id") {
            this._element = document.getElementById(this._id);
        } else {
            this._element = element;
        }
        this._change_event = change_event;
        this._render_event = render_event;
        this._config = deep_clone(config);

        this.render();
    }

    id(): string {
        return this._id;
    }

    name(): string {
        return this._name;
    }

    set_name(new_name: string) {
        this._name = new_name;
        this.render_from_scratch();
    }

    element(): HTMLElement | null {
        return this._element;
    }

    set_element(new_element: HTMLElement | null) {
        this._element = new_element;
    }

    change_event(): ParamChangeEvent | null {
        return this._change_event;
    }

    set_change_event(new_event: ParamChangeEvent | null) {
        this._change_event = new_event;
    }

    render_event(): ParamRenderEvent | null {
        return this._render_event;
    }

    set_render_event(new_event: ParamRenderEvent | null) {
        this._render_event = new_event;
    }

    config(): Dictionary {
        return this._config;
    }

    set_config(new_config: Dictionary) {
        this._config = deep_clone(new_config);
    }

    get(): Value {
        return this._value;
    }

    set(new_value: Value, invoke_change_event: boolean = false) {
        if (typeof new_value !== typeof this._value) {
            throw new Error(
                "can't change parameter's value type after it's been " +
                "constructed."
            );
        }

        const old_value = deep_clone(this._value);
        this._value = deep_clone(new_value);

        if (invoke_change_event && this._change_event !== null) {
            this._change_event(this, old_value, this._value, true);
        }

        this.render();
    }

    get_string(): string {
        let unit_str: string = "";
        if (typeof (this._config.value_unit) === "string") {
            unit_str = " " + this._config.value_unit;
        }

        if (typeof this._value === "number") {
            let s_value: string =
                number_to_str(this._value, this._config.decimal_digits);

            return s_value + unit_str;
        } else if (this._value instanceof Vec2) {
            let s_value_x: string =
                number_to_str(this._value.x, this._config.decimal_digits);

            let s_value_y: string =
                number_to_str(this._value.y, this._config.decimal_digits);

            return `${s_value_x}${unit_str}, ${s_value_y}${unit_str}`;
        } else {
            throw new Error("unsupported value type");
        }
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
            let slider = elem.appendChild(slider_create(
                (this._config.min || 0.) as number,
                (this._config.max || 1.) as number,
                (this._config.step || .001) as number,
                this._value
            ));

            let indicator = slider_get_indicator(slider);
            indicator.innerHTML = this.get_string();

            let input = slider_get_input(slider);
            input.addEventListener("input", () => {
                const old_value = deep_clone(this._value);
                this._value = parseFloat(input.value);

                indicator.innerHTML = this.get_string();

                if (this._change_event !== null) {
                    this._change_event(this, old_value, this._value, false);
                }
            });
        }
        else if (this._value instanceof Vec2) {
            let input_x = elem.appendChild(document.createElement("input"));
            input_x.className = "control";
            input_x.type = "range";
            input_x.min = ((this._config.min || 0.) as number).toString();
            input_x.max = ((this._config.max || 1.) as number).toString();
            input_x.step = ((this._config.step || .001) as number).toString();
            input_x.value = this._value.toString();
            input_x.addEventListener("input", () => {
                const old_value = deep_clone(this._value);
                (this._value as Vec2).x = parseFloat(input_x.value);

                if (this._change_event !== null) {
                    this._change_event(this, old_value, this._value, false);
                }
            });

            let input_y = elem.appendChild(document.createElement("input"));
            input_y.className = "control";
            input_y.type = "range";
            input_y.min = input_x.min;
            input_y.max = input_x.max;
            input_y.step = input_x.step;
            input_y.value = this._value.toString();
            input_y.addEventListener("input", () => {
                const old_value = deep_clone(this._value);
                (this._value as Vec2).y = parseFloat(input_y.value);

                if (this._change_event !== null) {
                    this._change_event(this, old_value, this._value, false);
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
            let slider = this._element!.getElementsByClassName(
                "slider-wrapper"
            )[0]! as HTMLElement;

            let input = slider_get_input(slider);
            input.value = this._value.toString();

            let indicator = slider_get_indicator(slider);
            indicator.innerHTML = this.get_string();
        }
        else if (this._value instanceof Vec2) {
            let inputs = this._element.getElementsByTagName("input");
            inputs[0].value = this._value.x.toString();
            inputs[1].value = this._value.y.toString();
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
    params: Array<Param>;

    constructor() {
        this.params = [];
    }

    add(new_param: Param) {
        for (const param of this.params) {
            if (param.id() === new_param.id()) {
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
}

interface State {
    canvas_ready: boolean,
    canvas: HTMLCanvasElement | null,
    gl: WebGL2RenderingContext | null,
    program: WebGLProgram | null,
    vbo: WebGLBuffer | null
}

var state: State = {
    canvas_ready: false,
    canvas: null,
    gl: null,
    program: null,
    vbo: null
};

var param_list = new ParamList();
var default_params: Param[] = []; // backup of the initial values

function reset_params() {
    for (const param of default_params) {
        param_list.get(param.id())!.set(param.get())
    }
    render_canvas();
}

function init() {
    // add parameters
    param_list.add(new Param(
        "tile_size",
        "Tile Size",
        new Vec2(200., 400.),
        "use-id",
        () => render_canvas(),
        null,
        { min: 10., max: 1000., step: 1., value_unit: "px", decimal_digits: 0 }
    ));
    param_list.add(new Param(
        "border_thickness",
        "Border Thickness",
        3.,
        "use-id",
        () => render_canvas(),
        null,
        { min: 0., max: 20., step: .25, value_unit: "px", decimal_digits: 2 }
    ));
    param_list.add(new Param(
        "grid_lines_density",
        "Density",
        400.,
        "use-id",
        () => render_canvas(),
        null,
        { min: 1., max: 2000., step: 1., decimal_digits: 0 }
    ));
    param_list.add(new Param(
        "grid_lines_thickness",
        "Thickness",
        1.,
        "use-id",
        () => render_canvas(),
        null,
        { min: 0., max: 20., step: .25, value_unit: "px", decimal_digits: 2 }
    ));
    param_list.add(new Param(
        "grid_lines_opacity_horizontal",
        "Horizontal Lines",
        0.,
        "use-id",
        () => render_canvas(),
        null,
        { min: 0., max: 1., step: .001, decimal_digits: 2 }
    ));
    param_list.add(new Param(
        "grid_lines_opacity_vertical",
        "Vertical Lines",
        .05,
        "use-id",
        () => render_canvas(),
        null,
        { min: 0., max: 1., step: .001, decimal_digits: 2 }
    ));
    param_list.add(new Param(
        "masjad_position",
        "Position",
        .125,
        "use-id",
        () => render_canvas(),
        null,
        { min: 0., max: .5, step: .001, decimal_digits: 2 }
    ));
    param_list.add(new Param(
        "masjad_radius",
        "Radius",
        .05,
        "use-id",
        () => render_canvas(),
        null,
        { min: 0., max: .5, step: .001, decimal_digits: 2 }
    ));
    param_list.add(new Param(
        "feet_vertical_position",
        "Position",
        .2,
        "use-id",
        () => render_canvas(),
        null,
        { min: 0., max: .5, step: .001, decimal_digits: 2 }
    ));
    param_list.add(new Param(
        "feet_horizontal_distance",
        "Distance",
        .12,
        "use-id",
        () => render_canvas(),
        null,
        { min: 0., max: .3, step: .001, decimal_digits: 2 }
    ));
    param_list.add(new Param(
        "feet_thickness",
        "Thickness",
        1.,
        "use-id",
        () => render_canvas(),
        null,
        { min: 0., max: 20., step: .25, value_unit: "px", decimal_digits: 2 }
    ));
    param_list.add(new Param(
        "feet_opacity",
        "Opacity",
        1.,
        "use-id",
        () => render_canvas(),
        null,
        { min: 0., max: 1., step: .001, decimal_digits: 2 }
    ));
    param_list.add(new Param(
        "feet_size",
        "Size",
        new Vec2(.05, .13),
        "use-id",
        () => render_canvas(),
        null,
        { min: 0., max: .3, step: .001, decimal_digits: 2 }
    ));
    param_list.add(new Param(
        "transform_scale",
        "Scale",
        new Vec2(1., 1.),
        "use-id",
        () => render_canvas(),
        null,
        { min: .1, max: 3., step: .001, decimal_digits: 2 }
    ));
    param_list.add(new Param(
        "transform_skew",
        "Skew",
        new Vec2(0., 0.),
        "use-id",
        () => render_canvas(),
        null,
        { min: -1., max: 1., step: .001, decimal_digits: 2 }
    ));
    param_list.add(new Param(
        "transform_rotation",
        "Rotation",
        0.,
        "use-id",
        () => render_canvas(),
        null,
        { min: -180., max: 180., step: .001, decimal_digits: 2 }
    ));
    param_list.add(new Param(
        "transform_offset",
        "Offset",
        new Vec2(0., 0.),
        "use-id",
        () => render_canvas(),
        null,
        { min: -200., max: 200., step: .25, value_unit: "px", decimal_digits: 2 }
    ));
    param_list.add(new Param(
        "background_color_h",
        "Hue",
        0.,
        "use-id",
        () => { update_color_blobs(); render_canvas(); },
        () => update_color_blobs(),
        { min: 0., max: 1., step: .001, decimal_digits: 2 }
    ));
    param_list.add(new Param(
        "background_color_s",
        "Saturation",
        0.,
        "use-id",
        () => { update_color_blobs(); render_canvas(); },
        () => update_color_blobs(),
        { min: 0., max: 1., step: .001, decimal_digits: 2 }
    ));
    param_list.add(new Param(
        "background_color_v",
        "Value",
        0.,
        "use-id",
        () => { update_color_blobs(); render_canvas(); },
        () => update_color_blobs(),
        { min: 0., max: 1., step: .001, decimal_digits: 2 }
    ));
    param_list.add(new Param(
        "pattern_color_h",
        "Hue",
        0.,
        "use-id",
        () => { update_color_blobs(); render_canvas(); },
        () => update_color_blobs(),
        { min: 0., max: 1., step: .001, decimal_digits: 2 }
    ));
    param_list.add(new Param(
        "pattern_color_s",
        "Saturation",
        0.,
        "use-id",
        () => { update_color_blobs(); render_canvas(); },
        () => update_color_blobs(),
        { min: 0., max: 1., step: .001, decimal_digits: 2 }
    ));
    param_list.add(new Param(
        "pattern_color_v",
        "Value",
        1.,
        "use-id",
        () => { update_color_blobs(); render_canvas(); },
        () => update_color_blobs(),
        { min: 0., max: 1., step: .001, decimal_digits: 2 }
    ));

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
    let background_color = view_transform(hsv_to_rgb([
        (param_list.get("background_color_h")?.get() || 0.) as number,
        (param_list.get("background_color_s")?.get() || 0.) as number,
        (param_list.get("background_color_v")?.get() || 0.) as number
    ]));
    let pattern_color = view_transform(hsv_to_rgb([
        (param_list.get("pattern_color_h")?.get() || 0.) as number,
        (param_list.get("pattern_color_s")?.get() || 0.) as number,
        (param_list.get("pattern_color_v")?.get() || 0.) as number
    ]));

    document.getElementById("background_color_blob")!.style.backgroundColor =
        `rgb(${background_color.join(", ")})`;
    document.getElementById("pattern_color_blob")!.style.backgroundColor =
        `rgb(${pattern_color.join(", ")})`;
}

function init_canvas() {
    state.canvas_ready = false;

    // try to get WebGL2 context
    state.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    state.gl = state.canvas.getContext("webgl2");
    if (state.gl) {
        document.getElementById("error-message")!.style.visibility = "collapse";
    }
    else {
        console.error("failed to get WebGL2 rendering context");
        document.getElementById("error-message")!.style.visibility = "visible";
        document.getElementById("controls")!.style.visibility = "collapse";
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
    const vertex_source: string = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
    v_uv = (a_position + 1.) * .5;
    gl_Position = vec4(a_position, 0., 1.);
}
`;

    // fragment shader
    const fragment_source: string = `#version 300 es

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
            hashf(ivec2(i, 10)),
            hashf(ivec2(i, 20))
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
        state.gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, state.vbo);
        state.gl.bufferData(
            WebGL2RenderingContext.ARRAY_BUFFER,
            quad_verts,
            WebGL2RenderingContext.STATIC_DRAW
        );

        // define vertex attributes layout in the VBO
        const position_loc =
            state.gl.getAttribLocation(state.program, "a_position");
        state.gl.enableVertexAttribArray(position_loc);
        state.gl.vertexAttribPointer(
            position_loc,
            2,
            WebGL2RenderingContext.FLOAT,
            false,
            0,
            0
        );

        // update state
        state.canvas_ready = true;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("failed to initialize canvas: ", error.message);
        } else {
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
    state.gl!.useProgram(state.program);

    // set uniforms
    {
        // render resolution
        set_uniform(
            state.program!,
            "res",
            new Vec2(state.canvas!.width, state.canvas!.height)
        );

        // tile
        set_uniform(
            state.program!,
            "tile_size",
            param_list.get("tile_size")!.get() as Vec2
        );
        set_uniform(
            state.program!,
            "border_thickness",
            param_list.get("border_thickness")!.get() as number
        );

        // grid lines
        set_uniform(
            state.program!,
            "grid_lines_density",
            param_list.get("grid_lines_density")!.get() as number
        );
        set_uniform(
            state.program!,
            "grid_lines_thickness",
            param_list.get("grid_lines_thickness")!.get() as number
        );
        set_uniform(
            state.program!,
            "grid_lines_opacity_horizontal",
            param_list.get("grid_lines_opacity_horizontal")!.get() as number
        );
        set_uniform(
            state.program!,
            "grid_lines_opacity_vertical",
            param_list.get("grid_lines_opacity_vertical")!.get() as number
        );

        // masjad
        set_uniform(
            state.program!,
            "masjad_position",
            param_list.get("masjad_position")!.get() as number
        );
        set_uniform(
            state.program!,
            "masjad_radius",
            param_list.get("masjad_radius")!.get() as number
        );

        // feet
        set_uniform(
            state.program!,
            "feet_vertical_position",
            param_list.get("feet_vertical_position")!.get() as number
        );
        set_uniform(
            state.program!,
            "feet_horizontal_distance",
            param_list.get("feet_horizontal_distance")!.get() as number
        );
        set_uniform(
            state.program!,
            "feet_size",
            param_list.get("feet_size")!.get() as Vec2
        );
        set_uniform(
            state.program!,
            "feet_thickness",
            param_list.get("feet_thickness")!.get() as number
        );
        set_uniform(
            state.program!,
            "feet_opacity",
            param_list.get("feet_opacity")!.get() as number
        );

        // transform
        set_uniform(
            state.program!,
            "transform_scale",
            param_list.get("transform_scale")!.get() as Vec2
        );
        set_uniform(
            state.program!,
            "transform_skew",
            param_list.get("transform_skew")!.get() as Vec2
        );
        set_uniform(
            state.program!,
            "transform_rotation",
            param_list.get("transform_rotation")!.get() as number
        );
        set_uniform(
            state.program!,
            "transform_offset",
            param_list.get("transform_offset")!.get() as Vec2
        );

        // colors
        let background_color = hsv_to_rgb([
            param_list.get("background_color_h")!.get() as number,
            param_list.get("background_color_s")!.get() as number,
            param_list.get("background_color_v")!.get() as number
        ]);
        let pattern_color = hsv_to_rgb([
            param_list.get("pattern_color_h")!.get() as number,
            param_list.get("pattern_color_s")!.get() as number,
            param_list.get("pattern_color_v")!.get() as number
        ]);
        set_uniform(
            state.program!,
            "background_color",
            arr_to_vec3(background_color)
        );
        set_uniform(
            state.program!,
            "pattern_color",
            arr_to_vec3(pattern_color)
        );
    }

    // bind VBO
    state.gl!.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, state.vbo);

    // draw
    state.gl!.clearColor(0, 0, 0, 1);
    state.gl!.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT);
    state.gl!.drawArrays(WebGL2RenderingContext.TRIANGLES, 0, 6);
}

function create_shader(type: number, source: string): WebGLShader {
    const shader = state.gl!.createShader(type);
    if (!shader) {
        throw new Error(`failed to create empty shader of type ${type}`);
    }

    state.gl!.shaderSource(shader, source);
    state.gl!.compileShader(shader);
    if (!state.gl!.getShaderParameter(
        shader,
        WebGL2RenderingContext.COMPILE_STATUS
    )) {
        const info = state.gl!.getShaderInfoLog(shader) || "(no info)";
        throw new Error(`failed to compile shader of type ${type}: ${info}`);
    }

    return shader;
}

function create_program(
    vertex_source: string,
    fragment_source: string
): WebGLProgram {
    const program: WebGLProgram = state.gl!.createProgram();
    const vs = create_shader(
        WebGL2RenderingContext.VERTEX_SHADER,
        vertex_source
    );
    const fs = create_shader(
        WebGL2RenderingContext.FRAGMENT_SHADER,
        fragment_source
    );

    state.gl!.attachShader(program, vs);
    state.gl!.attachShader(program, fs);
    state.gl!.linkProgram(program);
    if (!state.gl!.getProgramParameter(
        program,
        WebGL2RenderingContext.LINK_STATUS
    )) {
        const info = state.gl!.getProgramInfoLog(program) || "(no info)";
        throw new Error(`failed to link graphics program: ${info}`);
    }

    return program;
}

// example dimensions: 1f (float), 3i (ivec3), basically the suffix after
// "gl.uniform".
function set_uniform(
    program: WebGLProgram,
    name: string,
    value: number | Vec2 | Vec3
): boolean {
    const location = state.gl!.getUniformLocation(program, name);
    if (!location) {
        return false;
    }

    if (typeof value === "number") {
        state.gl!.uniform1f(location, value);
    } else if (value instanceof Vec2) {
        state.gl!.uniform2f(location, value.x, value.y);
    } else if (value instanceof Vec3) {
        state.gl!.uniform3f(location, value.x, value.y, value.z);
    } else {
        throw new Error("unsupported uniform type");
    }

    return true;
}

function clamp01(v: number): number {
    return Math.min(Math.max(v, 0.), 1.);
}

function view_transform(rgb: number[]): number[] {
    return rgb.map(v => Math.round(255. * Math.pow(clamp01(v), 1. / 2.2)));
}

// source (minor tweaks): https://stackoverflow.com/a/17243070
function hsv_to_rgb(hsv: number[]): number[] {
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
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [r, g, b];
}

function deep_clone<T>(v: T): T {
    // null or primitive types
    if (v === null || typeof v !== 'object') {
        return v;
    }

    // built-in types that should be copied by constructor
    if (v instanceof Date) {
        return new Date(v.getTime()) as T;
    }
    /*if (v instanceof RegExp) {
        return new RegExp(v.source, v.flags) as T;
    }*/

    // arrays
    if (Array.isArray(v)) {
        return v.map(item => deep_clone(item)) as T;
    }

    // at this point, v is either a class instance of a plain object, so let's
    // check that.
    const proto = Object.getPrototypeOf(v);
    const is_plain: boolean = (proto === Object.prototype || proto === null);

    // class instance (non-plain objects)
    if (!is_plain) {
        const cloned_instance = Object.create(proto);
        for (const key of Object.getOwnPropertyNames(v)) {
            cloned_instance[key] = deep_clone((v as any)[key]);
        }
        return cloned_instance as T;
    }

    // try structuredClone() for plain objects
    if (typeof structuredClone === 'function') {
        try {
            return structuredClone(v);
        } catch {
            // fallback below
        }
    }

    // fallback if structuredClone() failed
    const clone: any = {};
    for (const key in v) {
        if (Object.prototype.hasOwnProperty.call(v, key)) {
            clone[key] = deep_clone((v as any)[key]);
        }
    }
    return clone;
}

function slider_create(
    min: number,
    max: number,
    step: number,
    value: number
): HTMLElement {
    let slider_wrapper = document.createElement("div");
    slider_wrapper.className = "control slider-wrapper";

    let input = slider_wrapper.appendChild(
        document.createElement("input")
    );
    input.className = "slider-input";
    input.type = "range";

    input.min = min.toString();
    input.max = max.toString();
    input.step = step.toString();
    input.value = value.toString();

    let indicator = slider_wrapper.appendChild(
        document.createElement("div")
    );
    indicator.className = "slider-indicator";

    input.addEventListener("mouseenter", () => {
        indicator.classList.add("slider-indicator-show");
    });
    input.addEventListener("mouseleave", () => {
        indicator.classList.remove("slider-indicator-show");
    });

    return slider_wrapper;
}

function slider_get_input(elem: HTMLElement): HTMLInputElement {
    return elem.getElementsByTagName("input")[0] as HTMLInputElement;
}

function slider_get_indicator(elem: HTMLElement): HTMLDivElement {
    return elem.getElementsByTagName("div")[0] as HTMLDivElement;
}

function number_to_str(
    v: number,
    decimal_digits: any = undefined
) {
    if (typeof decimal_digits === "number") {
        return v.toFixed(decimal_digits);
    } else {
        return v.toString();
    }
}
