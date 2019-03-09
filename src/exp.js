import {log} from "./debug";
import {control} from "./model/cc";
import {knobs} from "./ui_knobs";
import {sendCC, updateDevice} from "./midi_out";
import MODEL from "./model";
import {appendMessage} from "./ui_messages";

let edit_exp_values = false;   // true when editing value2

export function inExpMode() {
    return edit_exp_values;
}

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

    if (display_exp_values) {
        $(".header.exp").addClass("lowercase");
    } else {
        $(".header.exp").removeClass("lowercase");
    }

} // setupKnobs

// TODO: find a better name
export function editExpValues(enable = true, update_device = true) {

    log(`editExpValues(${enable})`);

    edit_exp_values = enable;
    if (edit_exp_values) {
        $("#exp-close").addClass("exp-on");
        $("#exp-open").removeClass("exp-on");

        // sendCC(MODEL.setControlValue("cc", MODEL.control_id.exp_pedal, 127));
        if (update_device) updateDevice("cc", MODEL.control_id.exp_pedal, 127);

        showExpValues(true);

        // appendMessage("You edit the second values");   //TODO: find a better message

    } else {
        $("#exp-close").removeClass("exp-on");
        // $("#exp-open").addClass("exp-on");

        // sendCC(MODEL.setControlValue("cc", MODEL.control_id.exp_pedal, 0));
        if (update_device) updateDevice("cc", MODEL.control_id.exp_pedal, 0);

        showExpValues(false);

        // appendMessage("You edit the default values");   //TODO: find a better message
    }
}

// TODO: find a better name
function editNormalValues() {
    editExpValues(false);
}

export function setupExp() {
    $("#exp-close").click(editExpValues);        // EXP slider "close"
    $("#exp-open").click(editNormalValues);     // EXP slider "open"
}

