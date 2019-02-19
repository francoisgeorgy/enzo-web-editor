import DEVICE from "./enzo/enzo";
import {TRACE} from "./debug";
import {settings} from "./settings";
import {showMidiOutActivity} from "./ui_midi_activity";
import {logOutgoingMidiMessage} from "./ui_midi_window";
import {setPresetNumber} from "./ui_presets";
import {MSG_SEND_SYSEX, setStatus} from "./ui_messages";

let midi_output = null;

export function getMidiOutputPort() {
    return midi_output;
}

export function setMidiOutputPort(port) {
    midi_output = port;
}


let last_send_time = performance.now();     // for echo suppression

export function getLastSendTime() {
    return last_send_time;
}

/**
 * Send a control value to the connected device.
 * @param control
 */
export function sendCC(control) {

    let a = DEVICE.getMidiMessagesForCC(control);

    for (let i=0; i<a.length; i++) {
        if (midi_output) {
            if (TRACE) console.log(`send CC ${a[i][0]} ${a[i][1]} (${control.name}) on MIDI channel ${settings.midi_channel}`);
            showMidiOutActivity();
            last_send_time = performance.now(); // for echo suppression

            midi_output.sendControlChange(a[i][0], a[i][1], settings.midi_channel);

        } else {
            if (TRACE) console.log(`(send CC ${a[i][0]} ${a[i][1]} (${control.name}) on MIDI channel ${settings.midi_channel})`);
        }
        logOutgoingMidiMessage("CC", a[i][0], a[i][1]);
    }
}

/**
 * Update the connected device.
 * Note: jQuery Knob transmits the value as a float
 *
 * Called by the onChange handlers of dials, switches and selects.
 *
 * @param control_type
 * @param control_number
 * @param value_float
 */
export function updateDevice(control_type, control_number, value_float) {

    let value = Math.round(value_float);

    if (TRACE) console.log("updateDevice", control_type, control_number, value_float, value);

    sendCC(DEVICE.setControlValue(control_type, control_number, value));
}


/**
 * Send all values to the connected device
 */
export function fullUpdateDevice(onlyChanged = false) {
    if (TRACE) console.log(`fullUpdateDevice(${onlyChanged})`);
    const c = DEVICE.control;
    for (let i=0; i < c.length; i++) {
        if (typeof c[i] === "undefined") continue;
        if (!onlyChanged || c[i].randomized) {
            sendCC(c[i]);
            c[i].randomized = false;
        }
    }
}


export function sendPC(pc) {
    setPresetNumber(pc);
    if (midi_output) {
        if (TRACE) console.log(`send program change ${pc}`);
        showMidiOutActivity();

        midi_output.sendProgramChange(pc, settings.midi_channel);

        setStatus(`Preset ${pc} selected.`, MSG_SEND_SYSEX);
    }
    logOutgoingMidiMessage("PC", pc);
}
