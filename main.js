_state = {};

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



/*___________ math & integer utils ____________*/

const float PI = 3.141592653589793238462643383;
const float TAU = 6.283185307179586476925286767;
const float PI_OVER_2 = 1.570796326794896619231321692;
const float INV_PI = .318309886183790671537767527;
const float INV_TAU = .159154943091895335768883763;
const float SQRT_2 = 1.414213562373095048801688724;
const float INV_SQRT_2 = .707106781186547524400844362;
const float PHI = 1.618033988749894848204586834;

#define FUNC_WRAP(T) \
T wrap(T v, float start, float end) \
{ \
    return start + mod(v - start, end - start); \
}

#define FUNC_REMAP(T) \
T remap(T v, float inp_start, float inp_end, float out_start, float out_end) \
{ \
    return out_start \
        + ((out_end - out_start) / (inp_end - inp_start)) * (v - inp_start); \
}

#define FUNC_REMAP_CLAMP(T) \
T remap_clamp( \
    T v, \
    float inp_start, \
    float inp_end, \
    float out_start, \
    float out_end \
) \
{ \
    T t = clamp((v - inp_start) / (inp_end - inp_start), 0., 1.); \
    return out_start + t * (out_end - out_start); \
}

#define FUNC_REMAP01(T) \
T remap01(T v, float inp_start, float inp_end) \
{ \
    return clamp((v - inp_start) / (inp_end - inp_start), 0., 1.); \
}

#define FUNC_LENGTH_SQ(T) \
float length_sq(T v) \
{ \
    return dot(v, v); \
}

#define FUNC_DIST_SQ(T) \
float dist_sq(T a, T b) \
{ \
    a -= b; \
    return dot(a, a); \
}

FUNC_WRAP(float)
FUNC_WRAP(vec2)
FUNC_WRAP(vec3)
FUNC_WRAP(vec4)

FUNC_REMAP(float)
FUNC_REMAP(vec2)
FUNC_REMAP(vec3)
FUNC_REMAP(vec4)

FUNC_REMAP_CLAMP(float)
FUNC_REMAP_CLAMP(vec2)
FUNC_REMAP_CLAMP(vec3)
FUNC_REMAP_CLAMP(vec4)

FUNC_REMAP01(float)
FUNC_REMAP01(vec2)
FUNC_REMAP01(vec3)
FUNC_REMAP01(vec4)

FUNC_LENGTH_SQ(vec2)
FUNC_LENGTH_SQ(vec3)
FUNC_LENGTH_SQ(vec4)

FUNC_DIST_SQ(vec2)
FUNC_DIST_SQ(vec3)
FUNC_DIST_SQ(vec4)

float chebyshev_dist(vec2 a, vec2 b)
{
    return max(abs(a.x - b.x), abs(a.y - b.y));
}

float chebyshev_dist(vec3 a, vec3 b)
{
    return max(
        max(abs(a.x - b.x), abs(a.y - b.y)),
        abs(a.z - b.z)
    );
}

float chebyshev_dist(vec4 a, vec4 b)
{
    return max(
        max(
            max(abs(a.x - b.x), abs(a.y - b.y)),
            abs(a.z - b.z)
        ),
        abs(a.w - b.w)
    );
}

#define idiv_ceil(a, b) (((a) + (b) - 1) / (b))
#define imod_positive(a, b) ((((a) % (b)) + (b)) % (b))

int iabs(int v)
{
    if (v < 0)
    {
        return -v;
    }
    return v;
}

int imin(int a, int b)
{
    if (a < b)
    {
        return a;
    }
    return b;
}

int imax(int a, int b)
{
    if (a > b)
    {
        return a;
    }
    return b;
}

int iclamp(int v, int start, int end)
{
    if (v < start)
    {
        v = start;
    }
    if (v > end)
    {
        v = end;
    }
    return v;
}

float min_component(vec2 v)
{
    return min(v.x, v.y);
}

float min_component(vec3 v)
{
    return min(min(v.x, v.y), v.z);
}

float min_component(vec4 v)
{
    return min(min(min(v.x, v.y), v.z), v.w);
}

float max_component(vec2 v)
{
    return max(v.x, v.y);
}

float max_component(vec3 v)
{
    return max(max(v.x, v.y), v.z);
}

float max_component(vec4 v)
{
    return max(max(max(v.x, v.y), v.z), v.w);
}

int min_component(ivec2 v)
{
    return imin(v.x, v.y);
}

int min_component(ivec3 v)
{
    return imin(imin(v.x, v.y), v.z);
}

int min_component(ivec4 v)
{
    return imin(imin(imin(v.x, v.y), v.z), v.w);
}

int max_component(ivec2 v)
{
    return imax(v.x, v.y);
}

int max_component(ivec3 v)
{
    return imax(imax(v.x, v.y), v.z);
}

int max_component(ivec4 v)
{
    return imax(imax(imax(v.x, v.y), v.z), v.w);
}

// error function (erf) approximation with max error: 1.5 * 10^-7
// https://en.wikipedia.org/wiki/Error_function
float erf(float v)
{
    const float p = .3275911;
    const float a1 = .254829592;
    const float a2 = -.284496736;
    const float a3 = 1.421413741;
    const float a4 = -1.453152027;
    const float a5 = 1.061405429;
    
    float x = abs(v);
    
    float t = 1. / (1. + p * x);
    float t2 = t * t;
    float t3 = t2 * t;
    float t4 = t3 * t;
    float t5 = t4 * t;
    
    float positive_only = 1. - exp(-x * x) * ((a1 * t) + (a2 * t2) + (a3 * t3) + (a4 * t4) + (a5 * t5));
    return sign(v) * positive_only;
}

// approx. CDF of normal / gaussian distribution with mean=0 and std=1
// https://en.wikipedia.org/wiki/Normal_distribution
float normal_cdf(float v)
{
    return erf(v * INV_SQRT_2) * .5 + .5;
}

float bilinear(
    float val_bl,
    float val_tl,
    float val_tr,
    float val_br,
    vec2 offs
)
{
    return mix(
        mix(val_bl, val_br, offs.x),
        mix(val_tl, val_tr, offs.x),
        offs.y
    );
}

// credits to AHSEN (https://www.shadertoy.com/user/01000001)
// https://www.desmos.com/calculator/5d6ph151vi interactive :D
float cubic_interp(float a, float b, float c, float d, float t)
{
    float one = t - 1.;
    float two = t - 2.;
    float three = t - 3.;
    return (
        (-one * two * three * a)
        + (t * one * two * d)
        + (3. * t * two * three * b)
        - (3. * t * one * three * c)
    ) / 6.;
}

float dist_along_line(vec2 p, vec2 line_start, vec2 line_end)
{
    vec2 dir = line_end - line_start;
    
    // normalize
    float len_sqr = dot(dir, dir);
    if (len_sqr < .0001)
        return 1e9;
    dir /= sqrt(len_sqr);
    
    return dot(
        dir,
        p - line_start
    );
}

float relative_dist_along_line(vec2 p, vec2 line_start, vec2 line_end)
{
    vec2 dir = line_end - line_start;
    return dot(
        dir,
        p - line_start
    );
}

// |a| * |b| * sin(theta)
float cross2d(vec2 a, vec2 b)
{
    return a.x * b.y - a.y * b.x;
}

// references for barycentric coordinates
// https://www.desmos.com/calculator/8g8xjejuox
// https://www.shadertoy.com/view/mdjBWK

vec3 cartesian_to_barycentric(
    vec2 p,
    vec2 v0,
    vec2 v1,
    vec2 v2,
    bool clamp_,
    out bool p_is_outside
)
{
    vec3 b = vec3(
        cross2d(v1 - p, v2 - p),
        cross2d(v2 - p, v0 - p),
        cross2d(v0 - p, v1 - p)
    ) / cross2d(v1 - v0, v2 - v0);
    p_is_outside = min(min(b.x, b.y), b.z) < 0.;
    if (clamp_)
    {
        b = max(b, 0.);
        b /= (b.x + b.y + b.z);
    }
    return b;
}

vec3 cartesian_to_barycentric(
    vec3 p,
    vec3 v0,
    vec3 v1,
    vec3 v2,
    bool clamp_,
    out bool p_is_outside
)
{
    vec3 b = vec3(
        length(cross(v1 - p, v2 - p)),
        length(cross(v2 - p, v0 - p)),
        length(cross(v0 - p, v1 - p))
    ) / length(cross(v1 - v0, v2 - v0));
    p_is_outside = min(min(b.x, b.y), b.z) < 0.;
    if (clamp_)
    {
        b = max(b, 0.);
        b /= (b.x + b.y + b.z);
    }
    return b;
}

float barycentric_interpolate(vec3 b, float v0, float v1, float v2)
{
    return dot(b, vec3(v0, v1, v2));
}

vec2 barycentric_interpolate(vec3 b, vec2 v0, vec2 v1, vec2 v2)
{
    return b.x * v0 + b.y * v1 + b.z * v2;
}

vec3 barycentric_interpolate(vec3 b, vec3 v0, vec3 v1, vec3 v2)
{
    return b.x * v0 + b.y * v1 + b.z * v2;
}

vec4 barycentric_interpolate(vec3 b, vec4 v0, vec4 v1, vec4 v2)
{
    return b.x * v0 + b.y * v1 + b.z * v2;
}

float barycentric_interpolate(vec2 b, float v0, float v1, float v2)
{
    return barycentric_interpolate(
        vec3(b.x, b.y, 1. - b.x - b.y),
        v0, v1, v2
    );
}

vec2 barycentric_interpolate(vec2 b, vec2 v0, vec2 v1, vec2 v2)
{
    return barycentric_interpolate(
        vec3(b.x, b.y, 1. - b.x - b.y),
        v0, v1, v2
    );
}

vec3 barycentric_interpolate(vec2 b, vec3 v0, vec3 v1, vec3 v2)
{
    return barycentric_interpolate(
        vec3(b.x, b.y, 1. - b.x - b.y),
        v0, v1, v2
    );
}

vec4 barycentric_interpolate(vec2 b, vec4 v0, vec4 v1, vec4 v2)
{
    return barycentric_interpolate(
        vec3(b.x, b.y, 1. - b.x - b.y),
        v0, v1, v2
    );
}

// angle from 0 to TAU
float get_angle(vec2 p)
{
    float a = atan(p.y, p.x);
    if (a < 0.)
    {
        return a + TAU;
    }
    return a;
}

mat2 rotate_2d(float angle)
{
    float s = sin(angle);
    float c = cos(angle);
    return mat2(
        c, s,
        -s, c
    );
}

vec2 perpendicular(vec2 v)
{
    return vec2(-v.y, v.x);
}

// s.x=theta
// s.y=phi
// (there's no r)
vec3 spherical_to_cartesian(vec2 s)
{
    float sin_theta = sin(s.x);
    return vec3(
        sin_theta * cos(s.y),
        sin_theta * sin(s.y),
        cos(s.x)
    );
}

// s.x=r
// s.y=theta
// s.z=phi
vec3 spherical_to_cartesian(vec3 s)
{
    float sin_theta = sin(s.y);
    return s.x * vec3(
        sin_theta * cos(s.z),
        sin_theta * sin(s.z),
        cos(s.y)
    );
}

vec2 screen_to_uv01(vec2 coord, vec2 res)
{
    return coord / res;
}

vec2 screen_to_uv_horizontal(vec2 coord, vec2 res)
{
    return (2. * coord - res) / res.x;
}

vec2 screen_to_uv_vertical(vec2 coord, vec2 res)
{
    return (2. * coord - res) / res.y;
}

vec2 screen_to_uv_fit(vec2 coord, vec2 res)
{
    return (2. * coord - res) / min_component(res);
}

vec2 screen_to_uv_fill(vec2 coord, vec2 res)
{
    return (2. * coord - res) / max_component(res);
}

// * idx starts at 1
float halton(int base, int idx)
{
    float result = 0.;
    float digit_weight = 1.;
    while (idx > 0)
    {
        digit_weight /= float(base);
        result += float(idx % base) * digit_weight;
        idx /= base;
    }
    return result;
}

// * idx starts at 1
vec2 halton_2d(int idx)
{
    return vec2(halton(2, idx), halton(3, idx));
}

// * idx starts at 1
vec3 halton_3d(int idx)
{
    return vec3(halton(2, idx), halton(3, idx), halton(5, idx));
}

// * idx starts at 1
vec4 halton_4d(int idx)
{
    return vec4(
        halton(2, idx),
        halton(3, idx),
        halton(5, idx),
        halton(7, idx)
    );
}

// encode a 32-bit unsigned integer into a float that can be used in a vec4
// to be stored in a buffer in Shadertoy. use buffer_decode() to undo this.
//
// IMPORTANT: 0 <= v <= 4,269,801,471
// in some implementations, all NaNs and infinity values collapse to a single
// value regardless of the original bit pattern. this makes it very hard to
// store arbitrary integers in float buffers. this function automatically jumps
// across those problematic values to avoid them at the cost of a lower maximum
// value, so make sure your input doesn't go above it!
//
// these are the ranges we need to avoid:
// 
// - subnormals
//   0 -> 8,388,607
//
// - positive NaNs and infinity
//   2,139,095,040 -> 2,147,483,647
//
// - negative NaNs and infinity
//   4,286,578,688 -> 4,294,967,295
//
// the last problematic range is already handled since we limit the maximum
// value.
//
// NOTE: Shadertoy appears to be using FP16 buffers in some mobile platforms,
// but this function is only designed to work with 32-bit values, so it may
// break in certain machines.
float buffer_encode(uint v)
{
    if (v >= 2130706432u)
    {
        return uintBitsToFloat(v + 2u * 8388608u);
    }
    return uintBitsToFloat(v + 8388608u);
}

// decodes integers encoded by buffer_encode()
uint buffer_decode(float v)
{
    uint x = floatBitsToUint(v);
    if (x >= 2130706432u + 8388608u)
    {
        return x - 2u * 8388608u;
    }
    return x - 8388608u;
}

bool icoord_in_bounds(ivec2 icoord, ivec2 ires)
{
    return
        icoord.x >= 0 &&
        icoord.y >= 0 &&
        icoord.x < ires.x &&
        icoord.y < ires.y;
}

bool icoord_in_bounds(ivec3 icoord, ivec3 ires)
{
    return
        icoord.x >= 0 &&
        icoord.y >= 0 &&
        icoord.z >= 0 &&
        icoord.x < ires.x &&
        icoord.y < ires.y &&
        icoord.z < ires.z;
}

int icoord_to_idx(ivec2 icoord, ivec2 ires)
{
    return icoord.x + (icoord.y * ires.x);
}

int icoord_to_idx(ivec3 icoord, ivec3 ires)
{
    return icoord.x + (icoord.y * ires.x) + (icoord.z * ires.x * ires.y);
}

ivec2 idx_to_icoord(int idx, ivec2 ires)
{
    return ivec2(idx % ires.x, idx / ires.x);
}

ivec3 idx_to_icoord(int idx, ivec3 ires)
{
    return ivec3(
        idx % ires.x,
        (idx % (ires.x * ires.y)) / ires.x,
        idx / (ires.x * ires.y)
    );
}

// https://www.desmos.com/calculator/kfe07basy9

uint compress_float_to_uint_linear(float f, float min_f, float max_f, uint max_i)
{
    return uint(floor(
        float(max_i) * remap01(f, min_f, max_f)
    ));
}

float decompress_float_from_uint_linear(
    uint i,
    uint max_i,
    float min_f,
    float max_f
)
{
    return remap_clamp(
        float(i) / float(max_i),
        0., 1.,
        min_f, max_f
    );
}

uint compress_float_to_uint_log(
    float f,
    float log2_zero_offset,
    float max_log2_f,
    uint max_i
)
{
    f = max(0., f);
    f += pow(2., log2_zero_offset);
    return uint(floor(
        float(max_i) * remap01(log2(f), log2_zero_offset, max_log2_f)
    ));
}

float decompress_float_from_uint_log(
    uint i,
    uint max_i,
    float log2_zero_offset,
    float max_log2_f
)
{
    return pow(2., remap_clamp(
        float(i) / float(max_i),
        0., 1.,
        log2_zero_offset, max_log2_f
    )) - pow(2., log2_zero_offset);
}



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



in vec2 v_uv;
out vec4 out_color;

// tile
const vec2 tile_size = vec2(200, 400); // px
const float border_thickness = 3.; // px

// grid lines
const float grid_lines_density = 210.;
const float grid_lines_thickness = 1.; // px
const float grid_lines_opacity_horizontal = .05;
const float grid_lines_opacity_vertical = .05;

// masjad
const float masjad_position = .125; // 0 = top, 1 = bottom
const float masjad_radius = .05; // relative to tile size

// feet
const float feet_vertical_position = .2; // 0 = bottom, 1 = top
const float feet_horizontal_distance = .12; // relative to tile size
const vec2 feet_size = vec2(.05, .13); // relative to tile size
const float feet_thickness = 1.; // px
const float feet_opacity = .2;

// transform
const vec2 transform_scale = vec2(1);
const float transform_rotation = 0.; // degrees
const vec2 transform_offset = vec2(0);

// colors
const vec3 background_color = vec3(0);
const vec3 pattern_color = vec3(1);

vec3 render(vec2 coord, vec2 res)
{
    // center coord
    coord -= (res * .5);

    // transform
    coord -= transform_offset;
    coord *= rotate_2d(radians(transform_rotation));
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
        v = max(
            remap01(tile_coord.x, half_thickness + .5, half_thickness - .5),
            remap01(
                tile_coord.x,
                tile_size.x - half_thickness - .5,
                tile_size.x - half_thickness + .5
            )
        );
        v = max(
            v,
            remap01(tile_coord.y, half_thickness + .5, half_thickness - .5)
        );
        v = max(
            v,
            remap01(
                tile_coord.y,
                tile_size.y - half_thickness - .5,
                tile_size.y - half_thickness + .5
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

        // vertical lines
        v = max(
            v,
            remap01(
                abs(mod(tile_coord.x, grid_cell_size.x) - grid_cell_size.x * .5),
                half_thickness + .5,
                half_thickness - .5
            ) * grid_lines_opacity_vertical
        );

        // horizontal lines
        v = max(
            v,
            remap01(
                abs(mod(tile_coord.y, grid_cell_size.y) - grid_cell_size.y * .5),
                half_thickness + .5,
                half_thickness - .5
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
        v = max(v, remap01(sd, .5, -.5));
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

        v = max(v, remap01(sd, .5, -.5) * feet_opacity);
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
    col += render(frag_coord, res);
    col += render(frag_coord + vec2(.51, .53), res);
    col += render(frag_coord + vec2(-.5, .48), res);
    col += render(frag_coord + vec2(-.47, -.54), res);
    col += render(frag_coord + vec2(.52, -.49), res);
    col /= 5.;
    
    // output
    col = view_transform(col);
    out_color = vec4(col, 1);
}
`;

    // create program
    const program = create_program(vertex_source, fragment_source);
    _state.gl.useProgram(program);

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