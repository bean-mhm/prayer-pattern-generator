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

function slider_get_input(elem: HTMLElement): HTMLInputElement {
    return elem.getElementsByTagName("input")[0] as HTMLInputElement;
}

function slider_get_indicator(elem: HTMLElement): HTMLDivElement {
    return elem.getElementsByTagName("div")[0] as HTMLDivElement;
}
