import {log} from "./debug";
import DEVICE from "./model";
import {displayPreset, setPresetNumber} from "./ui_presets";
import {updateUI} from "./ui";
import {fullUpdateDevice} from "./midi_out";
import {clearError, setStatus} from "./ui_messages";

export function init() {
    log("init()");
    DEVICE.init();
    setPresetNumber(0);
    displayPreset();
    updateUI(true);
    fullUpdateDevice();
    clearError();
    setStatus("Enzo set to 'init' configuration.");
    return false;   // disable the normal href behavior
}

export function randomize() {
    log("randomize");
    DEVICE.randomize();
    setPresetNumber(0);
    displayPreset();
    updateUI();
    fullUpdateDevice(true);    // true == update only updated values (values which have been marked as changed)
    clearError();
    setStatus("Enzo randomized.");
    return false;   // disable the normal href behavior
}
