/// <reference path="utils.ts" />
/// <reference path="params.ts" />
/// <reference path="gl.ts" />

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
    // events
    document.getElementById("btn-hide")!.addEventListener("click", () => {
        document.getElementById("controls")!.classList.add("hide");
        document.getElementById("canvas")!.classList.remove("untouchable", "negative-z");
    });
    document.getElementById("canvas")!.addEventListener("click", () => {
        document.getElementById("controls")!.classList.remove("hide");
        document.getElementById("canvas")!.classList.add("untouchable", "negative-z");
    });
    document.getElementById("btn-reset-all")!.addEventListener("click", () => {
        reset_params();
    });
    document.getElementById("btn-import")!.addEventListener("click", () => {
        import_params();
    });
    document.getElementById("btn-export")!.addEventListener("click", () => {
        export_params();
    });

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
        { min: .1, max: 3., step: .001, decimal_digits: 3 }
    ));
    param_list.add(new Param(
        "transform_skew",
        "Skew",
        new Vec2(0., 0.),
        "use-id",
        () => render_canvas(),
        null,
        { min: -1., max: 1., step: .001, decimal_digits: 3 }
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
        document.getElementById("error-message")!.classList.add("vanish");
    }
    else {
        console.error("failed to get WebGL2 rendering context");
        document.getElementById("error-message")!.classList.remove("vanish");
        document.getElementById("controls")!.classList.add("vanish");
        return;
    }

    // viewport resolution
    const dpr = window.devicePixelRatio || 1;
    state.canvas.width = Math.floor(window.innerWidth * dpr);
    state.canvas.height = Math.floor(window.innerHeight * dpr);
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
        state.program = create_program(
            state.gl,
            vertex_source,
            fragment_source
        );

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
            state.gl!, state.program!,
            "res",
            new Vec2(state.canvas!.width, state.canvas!.height)
        );

        // ordinary parameters
        for (const param of param_list.params) {
            if (typeof param.get() === "number"
                || param.get() instanceof Vec2
                || param.get() instanceof Vec3) {
                set_uniform(
                    state.gl!,
                    state.program!,
                    param.id(),
                    param.get()
                );
            }
        }

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
            state.gl!, state.program!,
            "background_color",
            arr_to_vec3(background_color)
        );
        set_uniform(
            state.gl!, state.program!,
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

const param_json_prefix: string = "prayer pattern data\n";

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
    save_text_as_file(
        "pattern.json",
        param_json_prefix + param_list.serialize()
    );
}
