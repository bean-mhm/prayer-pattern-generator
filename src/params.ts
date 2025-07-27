/// <reference path="utils.ts" />
/// <reference path="ui.ts" />

type Value = boolean | number | Vec2;

function get_value_type(v: Value): string {
    if (["number", "boolean"].includes(typeof v)) {
        return typeof v;
    }
    else if (v instanceof Vec2) {
        return "Vec2";
    }
    else {
        throw new Error("unsupported value type");
    }
}

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

    number_to_str(v: number): string {
        let s_value: string;
        if (typeof this._config.decimal_digits === "number") {
            s_value = v.toFixed(this._config.decimal_digits);
        } else {
            s_value = v.toString();
        }

        let unit_str: string = "";
        if (typeof (this._config.value_unit) === "string") {
            unit_str = " " + text_bank.resolve(this._config.value_unit);
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

        if (typeof this._value !== "boolean") {
            let label = elem.appendChild(document.createElement("div"));
            label.className = "control-label";
            label.innerHTML = text_bank.resolve(this._name);
        }

        if (typeof this._value === "boolean") {
            elem.classList.add("width-fit");

            let checkbox = elem.appendChild(checkbox_create(
                text_bank.resolve(this._name),
                this._value
            ));

            let input = checkbox_get_input(checkbox);
            input.addEventListener("change", () => {
                const old_value = this._value;
                this._value = input.checked;

                if (this._change_event !== null) {
                    this._change_event(this, old_value, this._value, false);
                }
            });
        }
        else if (typeof this._value === "number") {
            let slider = elem.appendChild(slider_create(
                (this._config.min || 0.) as number,
                (this._config.max || 1.) as number,
                (this._config.step || .001) as number,
                this._value
            ));

            let indicator = slider_get_indicator(slider);
            indicator.innerHTML = this.number_to_str(this._value);

            let input = slider_get_input(slider);
            input.addEventListener("input", () => {
                const old_value = this._value;
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
                let slider = elem.appendChild(slider_create(
                    (this._config.min || 0.) as number,
                    (this._config.max || 1.) as number,
                    (this._config.step || .001) as number,
                    this._value.x
                ));

                slider.style.marginInlineEnd = "0.15rem";

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
                let slider = elem.appendChild(slider_create(
                    (this._config.min || 0.) as number,
                    (this._config.max || 1.) as number,
                    (this._config.step || .001) as number,
                    this._value.y
                ));

                slider.style.marginInlineStart = "0.15rem";

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

        if (typeof this._value === "boolean") {
            let checkbox = this._element!.getElementsByClassName(
                "checkbox-wrapper"
            )[0]! as HTMLElement;

            checkbox_set_checked(checkbox, this._value);
        }
        else if (typeof this._value === "number") {
            let slider = this._element!.getElementsByClassName(
                "slider-wrapper"
            )[0]! as HTMLElement;

            slider_get_input(slider).value = this._value.toString();

            slider_get_indicator(slider).innerHTML =
                this.number_to_str(this._value);
        }
        else if (this._value instanceof Vec2) {
            let slider_x = this._element!.getElementsByClassName(
                "slider-wrapper"
            )[0]! as HTMLElement;

            let slider_y = this._element!.getElementsByClassName(
                "slider-wrapper"
            )[1]! as HTMLElement;

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

    render_all(from_scratch: boolean = false) {
        if (from_scratch) {
            for (const param of this.params) {
                param.render_from_scratch();
            }
        }
        else {
            for (const param of this.params) {
                param.render();
            }
        }
    }

    serialize() {
        let data: Dictionary = {};
        for (const param of this.params) {
            data[param.id()] = {
                type: get_value_type(param.get()),
                value: param.get()
            } as Dictionary;
        }
        return JSON.stringify(data);
    }

    deserialize(s_data: string, invoke_change_event: boolean = false) {
        let data = JSON.parse(s_data) as Dictionary;
        for (const key in data) {
            if (!data.hasOwnProperty(key)) {
                continue;
            }

            let param = this.get(key);
            if (param === null) {
                console.warn(
                    "data contains a parameter ID that doesn't currently exist"
                );
                continue;
            }

            let elem = data[key] as Dictionary;
            if (get_value_type(param.get()) !== (elem.type! as string)) {
                throw new Error("data has a different value type");
            }

            if (typeof param.get() === "boolean") {
                param.set(elem.value! as boolean, invoke_change_event);
            }
            else if (typeof param.get() === "number") {
                param.set(elem.value! as number, invoke_change_event);
            } else if (param.get() instanceof Vec2) {
                param.set(new Vec2(
                    (elem.value! as Vec2).x,
                    (elem.value! as Vec2).y
                ));
            } else {
                throw new Error("unsupported value type");
            }
        }
    }
}
