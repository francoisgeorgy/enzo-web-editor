import {log} from "./debug";
import MODEL from "./model";
import {getMidiOutputPort, sendPC} from "./midi_out";
import {getMidiInputPort} from "./midi_in";
import {updateUrl} from "./url";

/*
    .preset :
        .sel   : current preset number in MODEL
        .on    : communication with the pedal is ON
        .dirty : preset has been modified; does not correspond to the _saved_ preset any more.

    The .dirty flag is cleared when we receive a preset (via sysex) or when we load a preset file.
*/

let dirty_cache = true;    // setPresetDirty is called each time a control is modified. This variable is used to minimize the DOM changes.

/*
export function isPresetClean() {
    return !dirty_cache;
}
*/

/**
 * Remove all flags and highlight color from the preset selectors.
 */
export function resetPresetSelectors() {
    log("resetPresetSelectors()");
    $(".preset-id").removeClass("dirty on sel");
    dirty_cache = false;
}

/**
 * Remove any dirty indicator from the preset selectors
 */
export function setPresetClean() {
    log("setPresetClean()");
    $(".preset-id").removeClass("dirty");
    dirty_cache = false;
}

/**
 * Show the dirty indicator on the current preset selector
 */
export function setPresetDirty() {
    if (!dirty_cache) {
        log("setPresetDirty()");
        $(".preset-id").removeClass("dirty");
        $(`#pc-${MODEL.getPresetNumber()}`).addClass("dirty");
        dirty_cache = true;
    }
}

/**
 * Update the preset selector to show the current pedal's preset.
 * Highlight the preset selector if the communication is up with the pedal.
 */
export function updatePresetSelector() {
    log("updatePresetSelector()");

    resetPresetSelectors();

    const n = MODEL.getPresetNumber();
    if (n) {
        const e = $(`#pc-${n}`);
        e.addClass("sel");
        if (getMidiInputPort() && getMidiOutputPort()) {
            e.addClass("on");
        }
    }
}

/**
 * Send PC to change preset and update the preset selectors in UI.
 * @param n
 */
export function presetSet(n) {
    log(`presetSet(${n})`);
    MODEL.setPresetNumber(n);
    updatePresetSelector();
    sendPC(n);
}

export function presetInc() {
    log("presetInc");
    presetSet((MODEL.getPresetNumber() % 16) + 1)
}

export function presetDec() {
    log("presetDec");
    const n = MODEL.getPresetNumber() - 1;
    presetSet(n < 1 ? 16 : n);
}

export function setupPresetSelectors() {
    $("div.preset-id").click(function() {
        log(`setupPresetSelectors: click on ${this.id}`);
        const c = this.id.split("-");
        const n = parseInt(c[1], 10);  //TODO: check if error
        presetSet(n);
    });
}

/* editor presets (library) */

const library = [];

export function addPresetToLibrary() {
    const h = updateUrl();
    library.push({
        h: h,
        name: 'no name'
    });
    console.log(library);

    let i = 0;
    let done = false;
    $('.presets-lib .preset-editor').each(function(index, element) {
        i++;
        let t = $(this).text().trim();
        // console.log(index + ": " + $(this).text(), t, typeof t, t === '', !!t, JSON.stringify(t), element);
        if (t === '') {
            // console.log('add', $(element));
            $(element).html(`<span class="preset-name">no name</span>`);
            done = true;
            return false;   // returning false stop the iteration
        }
    });
    // console.log(i, done);
    if (!done) {
        // console.log("add",4 - (i % 4), "slots");
        $('.presets-lib').first().append(`<div class="preset preset-editor"><span class="preset-name">yolo</span></div>`);
    }


}
