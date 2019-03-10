import {log} from "./debug";

let preset_number = 0;
let dirty = false;      // true if the preset has been modified in the editor but not saved in Enzo. This flag is used to avoid changing the html element class too often.

// export function getPresetNumber() {
//     return preset_number;
// }

export function setPresetNumber(pc) {
    preset_number = pc;
}

export function displayPreset() {
    dirty = false;
    $(".preset-id").removeClass("on dirty");
    $(`#pc-${preset_number}`).addClass("on");
}

//TODO: call dirtyPreset() as soon as a control is changed, except EXP (CC 4) and BYPASS
export function dirtyPreset() {
    if (!dirty) $(`#pc-${preset_number}`).removeClass("on").addClass("dirty");
    dirty = true;
}

export function cleanPreset() {
    displayPreset();
}

export function presetInc(callback) {
    log("presetInc");
    callback("pc", (preset_number % 16) + 1);
    displayPreset();
}

export function presetDec(callback) {
    log("presetDec");
    preset_number--;
    if (preset_number < 1) preset_number = 16;
    callback("pc", preset_number);
    displayPreset();
}

export function setupPresetSelectors(callback) {
    log("setupPresetSelectors()");
    $("div.preset-id").click(function() {
        log(`setupPresetSelectors: click on ${this.id}`);
        // if (!this.classList.contains("on")) {   // if not already on...
        //     $(this).siblings(".preset-id").removeClass("on dirty");
        //     this.classList.remove("dirty");
        //     this.classList.add("on");
        // }
        const c = this.id.split("-");
        log(`setupPresetSelectors: click on ${this.id}`, c[0], c[1]);
        setPresetNumber(c[1]);
        displayPreset(c[1]);
        callback("pc", c[1]);
    });
}
