/// <reference path="utils.ts" />

function create_shader(
    gl: WebGL2RenderingContext,
    type: number,
    source: string
): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error(`failed to create empty shader of type ${type}`);
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(
        shader,
        WebGL2RenderingContext.COMPILE_STATUS
    )) {
        const info = gl.getShaderInfoLog(shader) || "(no info)";
        throw new Error(`failed to compile shader of type ${type}: ${info}`);
    }

    return shader;
}

function create_program(
    gl: WebGL2RenderingContext,
    vertex_source: string,
    fragment_source: string
): WebGLProgram {
    const program: WebGLProgram = gl.createProgram();
    const vs = create_shader(
        gl,
        WebGL2RenderingContext.VERTEX_SHADER,
        vertex_source
    );
    const fs = create_shader(
        gl,
        WebGL2RenderingContext.FRAGMENT_SHADER,
        fragment_source
    );

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(
        program,
        WebGL2RenderingContext.LINK_STATUS
    )) {
        const info = gl.getProgramInfoLog(program) || "(no info)";
        throw new Error(`failed to link graphics program: ${info}`);
    }

    return program;
}

// example dimensions: 1f (float), 3i (ivec3), basically the suffix after
// "gl.uniform".
function set_uniform(
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    name: string,
    value: number | Vec2 | Vec3,
    is_int: boolean = false
): boolean {
    const location = gl.getUniformLocation(program, name);
    if (!location) {
        return false;
    }

    if (is_int) {
        if (typeof value === "number") {
            gl.uniform1i(location, value);
            return true;
        }
        if (value instanceof Vec2) {
            gl.uniform2i(location, value.x, value.y);
            return true;
        }
        if (value instanceof Vec3) {
            gl.uniform3i(location, value.x, value.y, value.z);
            return true;
        }
    }
    else {
        if (typeof value === "number") {
            gl.uniform1f(location, value);
            return true;
        }
        if (value instanceof Vec2) {
            gl.uniform2f(location, value.x, value.y);
            return true;
        }
        if (value instanceof Vec3) {
            gl.uniform3f(location, value.x, value.y, value.z);
            return true;
        }
    }

    throw new Error("unsupported uniform type");
}
