/*
<div class="control slider-wrapper">
  <input class="slider-input" type="range">
  <div class="slider-indicator">100 cm</div>
</div>
*/
function slider_create(
    min: number,
    max: number,
    step: number,
    value: number
): HTMLElement {
    let wrapper = document.createElement("div");
    wrapper.className = "control slider-wrapper";

    let input = wrapper.appendChild(document.createElement("input"));
    input.className = "slider-input";
    input.type = "range";

    input.min = min.toString();
    input.max = max.toString();
    input.step = step.toString();
    input.value = value.toString();

    let indicator = wrapper.appendChild(document.createElement("div"));
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

    return wrapper;
}

function slider_get_input(elem: HTMLElement): HTMLInputElement {
    return elem.getElementsByTagName("input")[0] as HTMLInputElement;
}

function slider_get_indicator(elem: HTMLElement): HTMLDivElement {
    return elem.getElementsByTagName("div")[0] as HTMLDivElement;
}

/*
<label class="checkbox-wrapper">
  <input type="checkbox" checked="checked">
  <span class="checkmark"></span>
  check me out
</label>
*/
function checkbox_create(label: string, checked: boolean): HTMLElement {
    let wrapper = document.createElement("label");
    wrapper.className = "control checkbox-wrapper";

    let input = wrapper.appendChild(
        document.createElement("input")
    );
    input.type = "checkbox";
    input.checked = checked;

    let checkmark = wrapper.appendChild(document.createElement("span"));
    checkmark.className = "checkmark";

    wrapper.innerHTML += label;

    return wrapper;
}

function checkbox_get_input(elem: HTMLElement): HTMLInputElement {
    return elem.getElementsByTagName("input")[0]!;
}

function checkbox_get_checked(elem: HTMLElement): boolean {
    return elem.getElementsByTagName("input")[0]!.checked;
}

function checkbox_set_checked(elem: HTMLElement, checked: boolean) {
    elem.getElementsByTagName("input")[0]!.checked = checked;
}

function control_container_create(id: string, label: string): HTMLElement {
    let elem: HTMLElement = document.createElement("div");
    elem.id = id;
    elem.className = "control-container";

    let lbl = elem.appendChild(document.createElement("div"));
    lbl.className = "control-label";
    lbl.innerHTML = label;

    return elem;
}
