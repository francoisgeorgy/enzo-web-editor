import {log} from "./debug";
import MODEL from "./model";
import Knob from "svg-knob";
import Slider from "svg-slider";
import {KNOB_THEME_DEFAULT} from "./ui_knobs_theme";

export const knobs = {};         // svg-knob

/**
 *
 */
export function setupKnobs(userActionCallback) {

    log("setupKnobs()");

    for (let i=0; i < MODEL.control.length; i++) {

        const c = MODEL.control[i];
        if (typeof c === "undefined") {
            // log("device undefined", i);
            continue;
        }

        const id = `${c.cc_type}-${c.cc_number}`;
        const v = MODEL.getControlValue(MODEL.control[i]);

        let elem = document.getElementById(id);
        if (elem === null) {
            continue;
        }
        if (!elem.classList.contains("knob")) continue;

        log(`configure #${id}: range=${c.cc_range}, init-value=${v}`);

        knobs[id] = new Knob(elem, KNOB_THEME_DEFAULT);
        knobs[id].config = {
            // zero_at: 270.0,
            // angle_min: 70.0,
            // angle_max: 290.0,
            value_min: Math.min(...c.cc_range),
            value_max: Math.max(...c.cc_range),
            default_value: v,
            center_zero: Math.min(...c.range) < 0,
            center_value: c.hasOwnProperty("cc_center") ? c.cc_center : c.init_value,
            format: v => c.human(v)
        };
        knobs[id].disableDebug();

        elem.addEventListener("change", function(event) {
            userActionCallback(c.cc_type, c.cc_number, event.detail);
        });
    }

    log("setup slider");

    let mixer_slider_scheme = {
        palette: "dark",
        value_min: 0,
        value_max: 127,
        width: 40,
        markers_length: 30,
        cursor_height: 12,
        cursor_width: 20,
        cursor_color: "#f8f812",
        track_color: "#f8f812",
        track_bg_color: "#333"
    };

    const slider_element = document.getElementById("cc-4");
    const slider = new Slider(slider_element, mixer_slider_scheme);

    document.getElementById("cc-4").addEventListener("change", function(event) {
        userActionCallback("cc", 4, event.detail);
    });


} // setupKnobs

/**
 *
 */
export function switchKnobsDisplay(display_raw_value = false) {

    log("switchKnobsDisplay()");

    for (const id in knobs) {
        if (knobs.hasOwnProperty(id)) {
            knobs[id].setConfigValue("display_raw", display_raw_value);
        }
    }

} // setupKnobs
