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

function browse_file(): Promise<string> {
    return new Promise((resolve, reject) => {
        // create a hidden file input element
        const input = document.body.appendChild(document.createElement('input'));
        input.type = 'file';
        input.style.display = 'none';

        input.addEventListener('change', () => {
            const file = input.files?.[0];
            if (!file) {
                cleanup();
                return reject(new Error('no file selected'));
            }

            const reader = new FileReader();

            reader.onload = () => {
                cleanup();
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                } else {
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

function load_text_from_file(): Promise<string> {
    return new Promise((resolve, reject) => {
        const input = document.body.appendChild(document.createElement("input"));
        input.type = "file";
        input.style.display = "none";
        input.addEventListener("change", () => {
            const file = input.files?.[0];
            if (!file) {
                cleanup();
                return reject(new Error("no file selected"));
            }

            const reader = new FileReader();
            reader.onload = () => {
                cleanup();
                if (typeof reader.result === "string") {
                    resolve(reader.result);
                } else {
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

function save_text_as_file(filename: string, content: string) {
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
