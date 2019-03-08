import {log} from "./debug";
import MODEL from "./model";
import Knob from "svg-knob";
import {KNOB_THEME_DEFAULT} from "./ui_knobs_theme";
import {control} from "./model/cc";

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

export function showExpValues(display_exp_values = false) {

    log("showExpValues()");

    // for (const id in knobs) {
    //     if (knobs.hasOwnProperty(id)) {
    //         //knobs[id].setConfigValue("display_raw", display_raw_value);
    //         knobs[id].value = display_raw_value ?
    //     }
    // }
    for (let i = 0; i < control.length; i++) {

        const c = control[i];
        if (typeof c === "undefined") continue;
        if (!c.two_values) continue;

        const id = `${c.cc_type}-${c.cc_number}`;

        if (knobs[id]) {
            knobs[id].value = display_exp_values ? c.raw_value2 : c.raw_value;
        }
    }

} // setupKnobs
