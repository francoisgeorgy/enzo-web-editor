import {showMidiInActivity} from "./ui_midi_activity";
import {displayPreset, setPresetNumber} from "./ui_presets";
import {logIncomingMidiMessage} from "./ui_midi_window";
import {getLastSendTime} from "./midi_out";
import {updateModelAndUI, updateUI} from "./ui";
import {log} from "./debug";
import MODEL from "./model";
import {
    appendErrorMessage,
    clearError,
    monitorMessage,
    setStatus
} from "./ui_messages";
import {toHexString} from "./utils";
import {SYSEX_GLOBALS, SYSEX_PRESET} from "./model/sysex";
import {updateGlobalConfig} from "./ui_global_settings";
import {resetExp} from "./ui_sliders";

let midi_input = null;

export function getMidiInputPort() {
    return midi_input;
}

export function setMidiInputPort(port) {
    midi_input = port;
    if (port) {
        log(`setMidiInputPort: midi_input assigned to "${port.name}"`);
    } else {
        log("setMidiInputPort: midi_input set to null");
    }
}

const monitors = new Array(127);

function monitorCC(control_number) {
    if (!MODEL.control[control_number]) return;
    clearTimeout(monitors[control_number]);
    monitors[control_number] = setTimeout(() => {
        const v = MODEL.control[control_number].raw_value;
        log(`monitor receive CC ${control_number} = ${v}`);
        monitorMessage(control_number, v);
    }, 200)
}

/**
 * Handle Program Change messages
 * @param msg
 */
export function handlePC(msg) {

    log("handlePC", msg);

    if (msg.type !== "programchange") return;

    // appendMessage(`Preset ${pc} selected`);  //TODO: filter if we are the one sending the PC; otherwise display the message.

    showMidiInActivity();
    logIncomingMidiMessage("PC", [msg.value]);
    setPresetNumber(msg.value);
    displayPreset();
}

/**
 * Handle all control change messages received
 * @param msg
 */
export function handleCC(msg) {

    // suppress echo:
    const t = performance.now();
    if (t < (getLastSendTime() + 100)) {
        log("handleCC: ignore CC echo");
        return;
    }

    const cc = msg[1];
    const v = msg[2];

    log("handleCC", cc, v);

    showMidiInActivity();
    monitorCC(cc);
    logIncomingMidiMessage("CC", [cc, v]);
    updateModelAndUI("cc", cc, v);
}

let suppress_sysex_echo = false;

/**
 * Set a flag to ignore the next incoming sysex only. The following sysex will not be ignored.
 * @param v
 */
export function suppressSysexEcho() {
    suppress_sysex_echo = true;
}

export function handleSysex(data) {

    // suppress echo:
/*
    const t = performance.now();
    if (t < (getLastSendTime() + 200)) {
        log("handleCC: ignore sysex echo");
        return;
    }
*/

    if (suppress_sysex_echo) {
        log("handleSysex: ignore sysex echo");
        suppress_sysex_echo = false;
        return;
    }

    log("%chandleSysex: SysEx received", "color: yellow; font-weight: bold", toHexString(data, ' '));
    showMidiInActivity();
    const valid = MODEL.setValuesFromSysEx(data);
    switch (valid.type) {
        case SYSEX_PRESET:
            resetExp();
            updateUI();
            clearError();
            setStatus(`Preset ${MODEL.meta.preset_id.value} settings received.`);
            break;
        case SYSEX_GLOBALS:
            updateGlobalConfig();
            clearError();
            setStatus(`Global config settings received.`);
            break;
        default:
            appendErrorMessage(valid.message);
    }

}
