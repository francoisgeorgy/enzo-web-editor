import {log} from "./debug";
import MODEL from "./model";
import {getMidiOutputPort, sendPC} from "./midi_out";
import {getMidiInputPort} from "./midi_in";
import {updateUrl} from "./url";
import * as lity from "lity";

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

const library = {};

export function initPresetsLibrary() {

    $("#menu-add-preset").click(addPresetToLibrary);

    //TODO: display: cut preset name after 16 char and add '...' if preset name longer than 16 chars

    // $(".preset-edit").click(function(){editPreset($(this).children('.preset-name').first())});
    // $(".preset-edit").click(function(){editPreset($(this))});

    // $(".preset-delete").click(
    //     function(){
    //         console.log("preset delete", this);
    //         const parent = $(this).parent('.preset-editor');
    //         parent.remove();
    //     }
    // );

/*
    $(".preset-name").on('input keydown keyup keypress',
        function(){
            console.log("preset input", this);
            // return false;
        }
    );
*/

/*
    $('body')
        .on('focus', '[contenteditable]', function() {
            console.log("focus contenteditable");
            const $this = $(this);
            $this.data('before', $this.html());
        })
        .on('blur keyup paste input', '[contenteditable]', function() {
            const $this = $(this);
            if ($this.data('before') !== $this.html()) {
                $this.data('before', $this.html());
                console.log("contenteditable changed");
                $this.trigger('change');
            }
        });
*/

}

function editPreset(key) {

    console.log(`editPreset(${key})`);

    // const p = elem.parents('.preset-editor').first();
    // const n = elem.siblings('.preset-name').first();

    // console.log(p.attr('id'), n.text());
    // console.log(elem.children('.preset-name').first());

    if (key in library) {

        $('#edit-preset-dialog-input').val(library[key].name);

        let lightbox = lity("#edit-preset-dialog");

        // var a = "contenteditable";
        // elem.attr(a) === 'true' ? elem.attr(a,'false') : elem.attr(a, 'true');

        // elem.attr('contenteditable',!elem.attr('contenteditable'));

    }
    return false;
}

function deletePreset(key) {
    console.log(`deletePreset(${key})`);
    return false;
}


function addPresetToLibrary() {

    let name = window.prompt("Preset name");

    //TODO: use timestamp as key
    //TODO: display sorted by key (timestamp)

    const dt = new Date();
    if (!name) name = `${
        dt.getFullYear().toString().padStart(4, '0')}.${
        (dt.getMonth()+1).toString().padStart(2, '0')}.${
        dt.getDate().toString().padStart(2, '0')} ${
        dt.getHours().toString().padStart(2, '0')}:${
        dt.getMinutes().toString().padStart(2, '0')}:${
        dt.getSeconds().toString().padStart(2, '0')}`;

    const id = Date.now();
    const h = updateUrl();
    const preset = {id, name, h};
    library[id] = preset;    // JS automatically convert the key to string type

    //TODO:
    // 1. get name
    // 2. save name and sysex in local storage
    // 3. format for display (cut if > 16 chars)
    // When edit:
    // - get name from local storage

    const p = createPresetDOM(preset);

    let i = 0;
    let done = false;
    $('.presets-lib .preset-editor').each(function(index, element) {
        i++;
        let t = $(this).text().trim();
        if (t === '') {
            $(element).replaceWith(p);
            done = true;
            return false;   // returning false stop the iteration
        }
    });
    if (!done) {
        $('.presets-lib').first().append(p);
    }

    displayPresets();
}

function createPresetDOM(preset) {
    const preset_edit = $(`<i class="fas fa-pen preset-edit" aria-hidden="true"></i>`).click(() => editPreset(preset.id));
    const preset_delete = $(`<i class="fas fa-times preset-delete" aria-hidden="true"></i>`).click(() => deletePreset(preset.id));
    const p =
        $(`<div/>`, {id: preset.id, "class": 'preset preset-editor'})
            .append($('<div class="preset-name-wrapper">')
                .append($(`<div class="preset-name"></div>`).text(preset.name))
                .append(preset_edit))
            .append(preset_delete);
    return p;
}

function createPresetPlaceholderDOM() {
    const p =
        $(`<div/>`, {"class": 'preset preset-editor'})
            .append($('<div class="preset-name-wrapper">')
                .append($(`<div class="preset-name"></div>`).html('&nbsp;'))
        );
    return p;
}

/**
 * rebuild the html presets library
 */
function displayPresets() {

    const lib = $(`<div/>`, {id: "presets-lib", "class": "presets-lib flex-grow"});

    let i = 0;
    for (const [key, value] of Object.entries(library)) {
        i++;
        lib.append(createPresetDOM(value));
    }

    for (;i < 16; i++) {
        lib.append(createPresetPlaceholderDOM());
    }

    $('#presets-lib').replaceWith(lib);

}
