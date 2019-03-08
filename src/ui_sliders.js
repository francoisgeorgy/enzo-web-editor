import {log} from "./debug";
import Slider from "svg-slider";
import MODEL from "./model";

export const sliders = {};

export function updateExpSlider(value) {
    const slider_value_element = document.getElementById(`cc-4-value`);
    slider_value_element.innerText = value;
}

export function setupSliders(userActionCallback) {

    log("setupSlider()");

    const id = "cc-4";

    let mixer_slider_scheme = {
        palette: "dark",
        value_min: 0,
        value_max: 127,
        width: 40,
        markers_length: 44,
        markers_width: 2,
        markers_color: "#999",
        cursor_height: 12,
        cursor_width: 26,
        cursor_color: "#f8f812",
        track_color: "#f8f812",
        track_bg_color: "#333"
    };

    const slider_element = document.getElementById(id);
    sliders[id] = new Slider(slider_element, mixer_slider_scheme);

    // const slider_value_element = document.getElementById(`${id}-value`);

    // if (slider_value_element) {
    //     slider_element.addEventListener("change", function(event) {
    //         userActionCallback("cc", 4, event.detail);
    //         const c = MODEL.control[MODEL.control_id.exp_pedal];
    //         slider_value_element.innerText = c.human()
    //     });
    // } else {
        slider_element.addEventListener("change", function(event) {
            userActionCallback("cc", 4, event.detail);
        });
    // }

}

