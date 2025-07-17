_state = {};
_params = {
    // tile
    tile_size: [200., 400], // px
    border_thickness: 3., // px

    // grid lines
    grid_lines_density: 210.,
    grid_lines_thickness: 1., // px
    grid_lines_opacity_horizontal: .05,
    grid_lines_opacity_vertical: .05,

    // masjad
    masjad_position: .125, // 0: top, 1: bottom
    masjad_radius: .05, // relative to tile size

    // feet
    feet_vertical_position: .2, // 0: bottom, 1: top
    feet_horizontal_distance: .12, // relative to tile size
    feet_size: [.05, .13], // relative to tile size
    feet_thickness: 1., // px
    feet_opacity: .2,

    // transform
    transform_scale: [1., 1.],
    transform_skew: [0., 0.],
    transform_rotation: 0., // degrees
    transform_offset: [0., 0.], // px

    // colors
    background_color: [0., 0., 0.],
    pattern_color: [1., 1., 1.]
};

function init_canvas() {
    _state.canvas_ready = false;

    const canvas = document.getElementById("canvas");
    const gl = canvas.getContext("webgl2");
    if (gl) {
        document.getElementById("error-message").style.visibility = "collapse";
    }
    else {
        document.getElementById("error-message").style.visibility = "visible";
        return;
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(document.body.clientWidth * dpr);
    canvas.height = Math.floor(document.body.clientHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);

    canvas.style.width = `${Math.floor(canvas.width / dpr)}px`;
    canvas.style.height = `${Math.floor(canvas.height / dpr)}px`;

    _state.canvas = canvas;
    _state.gl = gl;
    _state.canvas_ready = true;

    render();
}

function render() {
    if (_state.canvas_ready !== true) {
        console.log("can't render because canvas is not ready.");
        return;
    }

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
// source: https://www.shadertoy.com/view/4sS3zz
float msign(in float x) { return (x<0.0)?-1.0:1.0; }
float sd_ellipse(vec2 p, vec2 ab)
{
  //if( ab.x==ab.y ) return length(p)-ab.x;

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

vec3 render(vec2 coord, vec2 res)
{
    // center coord
    coord -= (res * .5);

    // transform (remember RORO: reverse order, reverse operation)
    coord -= transform_offset;
    coord *= rotate_2d(radians(transform_rotation));
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

        vec2 ellipse_dimensions = feet_size * overall_scale;

        float sd = min(
            abs(sd_ellipse(
                tile_coord - left_ellipse_center,
                ellipse_dimensions
            )) - feet_thickness,
            abs(sd_ellipse(
                tile_coord - right_ellipse_center,
                ellipse_dimensions
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
    // get current pixel position and the resolution
    vec2 frag_coord = gl_FragCoord.xy;
    vec2 res = frag_coord / v_uv;

    // render (average multiple samples)
    vec3 col = vec3(0);
    const int N_SAMPLES = 32;
    for (int i = 0; i < N_SAMPLES; i++)
    {
        vec2 offs = vec2(
            hashf(ivec2(i, 10)),
            hashf(ivec2(i, 20))
        ) - .5;
        
        col += render(
            frag_coord + offs,
            res
        );
    }
    col /= float(N_SAMPLES);
    
    // output
    col = view_transform(col);
    out_color = vec4(col, 1);
}
`;

    // create program
    const program = create_program(vertex_source, fragment_source);
    _state.gl.useProgram(program);

    // set uniforms
    {
        // tile
        set_uniform(program, "tile_size", "2f", _params.tile_size);
        set_uniform(program, "border_thickness", "1f", _params.border_thickness);

        // grid lines
        set_uniform(program, "grid_lines_density", "1f", _params.grid_lines_density);
        set_uniform(program, "grid_lines_thickness", "1f", _params.grid_lines_thickness);
        set_uniform(program, "grid_lines_opacity_horizontal", "1f", _params.grid_lines_opacity_horizontal);
        set_uniform(program, "grid_lines_opacity_vertical", "1f", _params.grid_lines_opacity_vertical);

        // masjad
        set_uniform(program, "masjad_position", "1f", _params.masjad_position);
        set_uniform(program, "masjad_radius", "1f", _params.masjad_radius);

        // feet
        set_uniform(program, "feet_vertical_position", "1f", _params.feet_vertical_position);
        set_uniform(program, "feet_horizontal_distance", "1f", _params.feet_horizontal_distance);
        set_uniform(program, "feet_size", "2f", _params.feet_size);
        set_uniform(program, "feet_thickness", "1f", _params.feet_thickness);
        set_uniform(program, "feet_opacity", "1f", _params.feet_opacity);

        // transform
        set_uniform(program, "transform_scale", "2f", _params.transform_scale);
        set_uniform(program, "transform_skew", "2f", _params.transform_skew);
        set_uniform(program, "transform_rotation", "1f", _params.transform_rotation);
        set_uniform(program, "transform_offset", "2f", _params.transform_offset);

        // colors
        set_uniform(program, "background_color", "3f", _params.background_color);
        set_uniform(program, "pattern_color", "3f", _params.pattern_color);
    }

    // fullscreen quad [-1, -1] to [1, 1]
    const quad_verts = new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        -1, 1,
        1, -1,
        1, 1
    ]);

    // buffer
    const vbo = _state.gl.createBuffer();
    if (!vbo) {
        throw new Error("failed to create empty buffer");
    }
    _state.gl.bindBuffer(_state.gl.ARRAY_BUFFER, vbo);
    _state.gl.bufferData(
        _state.gl.ARRAY_BUFFER,
        quad_verts,
        _state.gl.STATIC_DRAW
    );

    // attribute
    const posLoc = _state.gl.getAttribLocation(program, "a_position");
    _state.gl.enableVertexAttribArray(posLoc);
    _state.gl.vertexAttribPointer(posLoc, 2, _state.gl.FLOAT, false, 0, 0);

    // draw
    _state.gl.clearColor(0, 0, 0, 1);
    _state.gl.clear(_state.gl.COLOR_BUFFER_BIT);
    _state.gl.drawArrays(_state.gl.TRIANGLES, 0, 6);
}

function create_shader(type, source) {
    const shader = _state.gl.createShader(type);
    if (!shader) {
        throw new Error(`failed to create empty shader of type ${type}`);
    }

    _state.gl.shaderSource(shader, source);
    _state.gl.compileShader(shader);
    if (!_state.gl.getShaderParameter(shader, _state.gl.COMPILE_STATUS)) {
        const info = _state.gl.getShaderInfoLog(shader);
        throw new Error(`failed to compile shader of type ${type}: ${info}`);
    }

    return shader;
}

function create_program(vertex_source, fragment_source) {
    const vs = create_shader(_state.gl.VERTEX_SHADER, vertex_source);
    const fs = create_shader(_state.gl.FRAGMENT_SHADER, fragment_source);

    const program = _state.gl.createProgram();
    if (!program) {
        throw new Error("failed to create empty graphics program");
    }

    _state.gl.attachShader(program, vs);
    _state.gl.attachShader(program, fs);
    _state.gl.linkProgram(program);
    if (!_state.gl.getProgramParameter(program, _state.gl.LINK_STATUS)) {
        const info = _state.gl.getProgramInfoLog(program);
        throw new Error(`failed to link graphics program: ${info}`);
    }

    return program;
}

// example dimensions: 1f (float), 3i (ivec3), basically the suffix after
// "gl.uniform".
function set_uniform(program, name, dimensions, value) {
    const location = _state.gl.getUniformLocation(program, name);
    if (!location) {
        return false;
    }

    if (!_state.gl[`uniform${dimensions}`]) {
        throw new RangeError(
            `invalid dimensions for shader uniform: "${dimensions}"`
        );
    }

    if (dimensions[0] === '1') {
        _state.gl[`uniform${dimensions}`](location, value);
    }
    else if (dimensions[0] === '2') {
        _state.gl[`uniform${dimensions}`](location, value[0], value[1]);
    }
    else if (dimensions[0] === '3') {
        _state.gl[`uniform${dimensions}`](location, value[0], value[1], value[2]);
    }
    else if (dimensions[0] === '4') {
        _state.gl[`uniform${dimensions}`](location, value[0], value[1], value[2], value[3]);
    }
    else {
        throw new RangeError(
            `invalid dimensions for shader uniform: "${dimensions}"`
        );
    }
    return true;
}
