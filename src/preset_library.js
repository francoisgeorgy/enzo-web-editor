import {log, TRACE, warn} from "./debug";
import {disableKeyboard} from "./ui_keyboard";
import * as lity from "lity";
import {updateUrl} from "./url";
import store from "storejs";
import MODEL from "./model";
import * as Utils from "./utils";
import {SYSEX_PRESET} from "./model/sysex";
import {resetExp} from "./ui_exp";
import {updateUI} from "./ui";
import {appendMessage} from "./ui_messages";
import {fullUpdateDevice} from "./midi_out";
import {getCurrentZoomLevel} from "./ui_size";
/* editor presets (library) */

const LOCAL_STORAGE_KEY = "studiocode.enzo-editor.library";

let edit_preset_dialog = null;

let library = {};

export function readStorage() {
    const s = store.get(LOCAL_STORAGE_KEY);
    if (s) library = JSON.parse(s);
}

export function updateStorage() {
    // Object.assign(preferences, preferences, options);
    store(LOCAL_STORAGE_KEY, JSON.stringify(library));
}

export function initPresetsLibrary() {

    readStorage();

    $('#library-toggle').click(() => {
        const library = $("#library");
        const label = $("#library-toggle-label");
        if (library.is(".closed")) {
            library.removeClass("closed");
            label.text("Close library");
        } else {
            library.addClass("closed");
            label.text("Open library");
        }
        return false;
    });

    $('#edit-preset-save-button').click(updatePreset);

    $("#menu-add-preset").click(addPresetToLibrary);

    displayPresets();

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

export function updatePreset() {

    const id = $('#edit-preset-dialog-id').val();

    console.log("update editor preset", id);

    if (id) {
        let name = $('#edit-preset-dialog-input').val();
        let descr = $('#edit-preset-dialog-description').val();

        console.log("update editor preset name", id, name);
        library[id].name = name;
        library[id].description = descr;

        $(`#name-${id}`).text(name);

        updateStorage();
    }

    if (edit_preset_dialog) edit_preset_dialog.close();
    edit_preset_dialog = null;

    $('#edit-preset-dialog input').val("");    // reset
}

function editPreset(key) {

    console.log(`editPreset(${key})`);

    // const p = elem.parents('.preset-editor').first();
    // const n = elem.siblings('.preset-name').first();

    // console.log(p.attr('id'), n.text());
    // console.log(elem.children('.preset-name').first());

    if (key in library) {

        disableKeyboard();

        $('#edit-preset-dialog-id').val(library[key].id);
        $('#edit-preset-dialog-input').val(library[key].name);
        $('#edit-preset-dialog-description').val(library[key].description);

        edit_preset_dialog = lity("#edit-preset-dialog");

        // var a = "contenteditable";
        // elem.attr(a) === 'true' ? elem.attr(a,'false') : elem.attr(a, 'true');

        // elem.attr('contenteditable',!elem.attr('contenteditable'));

    }
    return false;
}

function deletePreset(id) {
    console.log(`deletePreset(#preset-${id})`);
    if (id) {
        // $(`#preset-${id}`).remove();
        delete(library[id]);
        updateStorage();
        displayPresets();
    }
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

    updateStorage();

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
    let limit;
    switch (getCurrentZoomLevel()) {
        case 1: limit = 18; break;
        case 2: limit = 20; break;
        default: limit = 16;
    }
    let name = preset.name;
    if (name.length > limit) name = name.substring(0, limit) + '...';
    const preset_edit = $(`<i class="fas fa-pen preset-edit" aria-hidden="true"></i>`).click(() => editPreset(preset.id));
    const preset_delete = $(`<i class="fas fa-times preset-delete" aria-hidden="true"></i>`).click(() => deletePreset(preset.id));
    const p =
        $(`<div/>`, {id: `preset-${preset.id}`, "class": 'preset preset-editor'}).click(() => usePreset(preset.id))
            .append($('<div class="preset-name-wrapper">')
                .append($(`<div/>`, {id: `name-${preset.id}`, "class": preset-name}).text(name))
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


function usePreset(id) {
    log(`usePreset(${id})`);

    if (id in library === false) {
        return;
    }

    const valid = MODEL.setValuesFromSysEx(Utils.fromHexString(library[id].h));

    if (valid.type === SYSEX_PRESET) {
        log("usePreset: sysex loaded in device");
        resetExp();
        updateUI();
        appendMessage("library preset loaded.", false, false);
        // if (updateConnectedDevice)
        fullUpdateDevice();
        return true;
    } else {
        log("usePreset: hash value is not a preset sysex");
        appendMessage(valid.message);
    }

}

