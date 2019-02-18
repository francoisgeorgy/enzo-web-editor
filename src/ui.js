import DEVICE from "./enzo/enzo";
import {displayPreset, setPresetNumber} from "./ui_presets";
import {TRACE} from "./debug";
import {knobs} from "./ui_knobs";
import {updateBypassSwitch, updateMomentaryStompswitch, updateOptionSwitch} from "./ui_switches";
import {sendPC, updateDevice} from "./midi_out";


/**
 * Handles a change made by the user in the UI.
 */
export function handleUserAction(control_type, control_number, value) {

    if (TRACE) console.log(`handleUserAction(${control_type}, ${control_number}, ${value})`);

    if (control_type === 'pc') {
        sendPC(control_number);
    } else {
        updateDevice(control_type, control_number, value);
    }

}

/**
 *
 * @param control_type
 * @param control_number
 * @param value
 * @param mappedValue
 */
export function updateControl(control_type, control_number, value, mappedValue) {

    if (TRACE) console.log(`updateControl(${control_type}, ${control_number}, ${value})`);

    if (mappedValue === undefined) {
        mappedValue = value;
    }

    const id = control_type + "-" + control_number;
    if (knobs.hasOwnProperty(id)) {
        knobs[id].value = value;
    } else {

        if (control_type === "cc" && control_number == 14) {
            updateBypassSwitch(value);
            return;
        }

        let c = $(`#${id}`);

        if (c.length) { // jQuery trick to check if element was found
            if (TRACE) console.warn("updateControl: unsupported control (1): ", control_type, control_number, value);
        } else {
            c = $(`#${id}-${mappedValue}`);
            if (c.length) {
                if (c.is(".bt")) {
                    updateOptionSwitch(id + "-" + mappedValue, mappedValue);
                } else if (c.is(".sw")) {
                    //TODO: handle .sw controls
                } else if (c.is(".swm")) {
                    updateMomentaryStompswitch(`${id}-${mappedValue}`, mappedValue);
                    setTimeout(() => updateMomentaryStompswitch(`${id}-${mappedValue}`, 0), 200);
                } else {
                    if (TRACE) console.warn("updateControl: unsupported control (2): ", control_type, control_number, value);
                }
            } else {
                if (TRACE) console.warn(`no control for ${id}-${mappedValue}`);
            }
        }

    }

}


/**
 * Set value of the controls (input and select) from the DEVICE values
 */
function updateControls() {
    if (TRACE) console.log("updateControls()");

    for (let i=0; i < DEVICE.control.length; i++) {
        if (typeof DEVICE.control[i] === "undefined") continue;
        updateControl(DEVICE.control[i].cc_type, i, DEVICE.getControlValue(DEVICE.control[i]), DEVICE.getMappedControlValue(DEVICE.control[i]));
    }

} // updateControls()

/**
 * Update the patch number and patch name displayed in the header.
 */
function updateMeta() {
    if (DEVICE.meta.preset_id.value) {
        setPresetNumber(DEVICE.meta.preset_id.value);
        displayPreset();
    }
}

/**
 * Update the UI from the DEVICE controls values.
 */
export function updateUI() {
    updateMeta();
    updateControls();
    if (TRACE) console.log("updateUI done");
}

/**
 * Update DEVICE and associated on-screen control from CC or NRPN value.
 *
 * @param control_type
 * @param control_number
 * @param value
 *
 * Return the device's control
 */
export function updateModelAndUI(control_type, control_number, value) {

    if (TRACE) console.log("updateModelAndUI", control_type, control_number, value, "#" + control_type + "-" + control_number);

    control_type = control_type.toLowerCase();
    if ((control_type !== "cc") && (control_type !== "nrpn")) {
        if (TRACE) console.warn(`updateModelAndUI: unsupported control type: ${control_type}`);
        return;
    }

    if (DEVICE.control[control_number]) {
        // update the model:
        DEVICE.setControlValue(control_type, control_number, value);
        // update the UI:
        updateControl(control_type, control_number, value);
    } else {
        if (TRACE) console.log(`the DEVICE does not support this control: ${control_number}`)
    }
}
