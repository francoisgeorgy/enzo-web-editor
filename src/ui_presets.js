import {log} from "./debug";
import MODEL from "./model";
import {sendPC} from "./midi_out";

// let preset_number = 0;
let dirty = false;      // true if the preset has been modified in the editor but not saved in Enzo. This flag is used to avoid changing the html element class too often.

export function setPresetClean() {
    dirty = false;
    $(".preset-id").removeClass("dirty");
}

export function setPresetDirty() {
    dirty = true;
    $(".preset-id").removeClass("dirty");
    $(`#pc-${MODEL.getPresetNumber()}`).addClass("dirty");
}

// export function setPresetNumber(pc) {
//     preset_number = pc;
// }

export function showPreset() {
    log("showPreset()");
    // if (dirty)
    $(".preset-id").removeClass("on");
    $(`#pc-${MODEL.getPresetNumber()}`).addClass("on");
    // dirty = false;
    // $(".preset-id").removeClass("on dirty");
    // $(`#pc-${preset_number}`).addClass("on");
}

//TODO: call dirtyPreset() as soon as a control is changed, except EXP (CC 4) and BYPASS
/*
export function dirtyPreset() {
    log("dirtyPreset()", dirty, preset_number);
    if (!dirty) $(`#pc-${preset_number}`).removeClass("on").addClass("dirty");
    dirty = true;
}
*/

/*
export function cleanPreset() {
    log("cleanPreset()");
    // displayPreset();
    dirty = false;
    $(".preset-id").removeClass("on dirty");
    $(`#pc-${preset_number}`).addClass("on");
}
*/

export function presetSet(n) {
    log(`presetSet(${n})`);
    MODEL.setPresetNumber(n);
    sendPC(n);
    // callback("pc", (preset_number % 16) + 1);
    setPresetClean();
    showPreset();
}

export function presetInc() {
    log("presetInc");
    // const n = (MODEL.getPresetNumber() % 16) + 1;
    presetSet((MODEL.getPresetNumber() % 16) + 1)
    // MODEL.setPresetNumber(n);
    // sendPC(n);
    // callback("pc", (preset_number % 16) + 1);
    // displayPreset();
}

export function presetDec() {
    log("presetDec");
    const n = MODEL.getPresetNumber() - 1;
    // if (n < 1) n = 16;
    presetSet(n < 1 ? 16 : n);
    // MODEL.setPresetNumber(n);
    // sendPC(n);
    // preset_number--;
    // if (preset_number < 1) preset_number = 16;
    // callback("pc", preset_number);
    // displayPreset();
}

export function setupPresetSelectors() {
    log("setupPresetSelectors()");
    $("div.preset-id").click(function() {
        log(`setupPresetSelectors: click on ${this.id}`);
        const c = this.id.split("-");
        // setPresetNumber(c[1]);
        const n = parseInt(c[1], 10);  //TODO: check if error
        presetSet(n);
        // callback("pc", c[1]);
    });
}
