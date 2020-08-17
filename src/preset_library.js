import {log, TRACE, warn} from "./debug";
import {disableKeyboard} from "./ui_keyboard";
import * as lity from "lity";
import {updateUrl} from "./url";
import store from "storejs";
import MODEL from "./model";
import * as Utils from "./utils";
import {SYSEX_END_BYTE, SYSEX_PRESET, validate} from "./model/sysex";
import {resetExp} from "./ui_exp";
import {updateControls, updateUI} from "./ui";
import {appendMessage} from "./ui_messages";
import {fullUpdateDevice} from "./midi_out";
import {getCurrentZoomLevel} from "./ui_size";
import {downloadLastSysEx} from "./download";
import {toHexString} from "./utils";
import {setPresetDirty} from "./ui_presets";
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

export function setupPresetsLibrary() {

    $("#menu-download-sysex").click(downloadLastSysEx);
    $("#menu-load-preset").click(loadPresetFromFile);
    $("#preset-file").change((event) => {
        readFiles(event.target.files);
    });     // in load-preset-dialog

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

    $("#menu-bookmark").click(addCurrentSettingsAsPresetToLibrary);
    $("#menu-add-preset").click(addCurrentSettingsAsPresetToLibrary);

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
    if (!window.confirm(`Delete library preset ${library[id].name} ?`)) return;
    if (id) {
        // $(`#preset-${id}`).remove();
        delete(library[id]);
        updateStorage();
        displayPresets();
    }
    return false;
}

function addCurrentSettingsAsPresetToLibrary() {

    let name = window.prompt("Preset name");
    if (name === null) return;

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
    // const h = updateUrl();
    const h = toHexString(MODEL.getPreset());

    addPresetToLibrary({id, name, h});
}

function addPresetToLibrary(preset) {

    library[preset.id] = preset;    // JS automatically convert the key to string type

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
    const preset_edit = $(`<i class="fas fa-pen preset-edit" aria-hidden="true"></i>`).click(
        (e) => {
            editPreset(preset.id);
            e.stopPropagation();
        }
    );
    const preset_delete = $(`<i class="fas fa-times preset-delete" aria-hidden="true"></i>`).click(
        (e) => {
            deletePreset(preset.id)
            e.stopPropagation();
        });
    const p =
        $(`<div/>`, {id: `preset-${preset.id}`, "class": 'preset preset-editor'}).click(() => usePreset(preset.id))
            .append($('<div class="preset-name-wrapper">')
                .append($(`<div/>`, {id: `name-${preset.id}`, "class": "preset-name"}).text(name))
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

    const valid = MODEL.setValuesFromSysEx(Utils.fromHexString(library[id].h), true);

    if (valid.type === SYSEX_PRESET) {
        log("usePreset: sysex loaded in device");
        setPresetDirty(true);   // must be done after updateUI()
        resetExp();
        // updateUI();
        updateControls();
        appendMessage("library preset loaded.", false, false);
        // if (updateConnectedDevice)
        fullUpdateDevice();

        markPresetAsSelected(id);

        return true;
    } else {
        log("usePreset: hash value is not a preset sysex");
        appendMessage(valid.message);
    }

}

function markPresetAsSelected(id) {
    markAllPresetsAsUnselected();
    $(`#preset-${$.escapeSelector(id)}`).addClass("on sel");
}

function markAllPresetsAsUnselected() {
    $('.preset-editor').removeClass('sel on');
}


//==================================================================================================================
// Preset file handling

let lightbox = null;    // lity dialog

/**
 *
 */
function loadPresetFromFile() {
    $("#load-preset-error").empty();
    $("#preset-file").val("");
    lightbox = lity("#load-preset-dialog");
    return false;   // disable the normal href behavior when called from an onclick event
}

/**
 * Handler for the #preset-file file input element in #load-preset
 */
function readFiles(files) {

    // console.log(files, typeof files);
    // return;

    for (const f of files) {
        let data = [];
        // let f = files[0];
        log(`read file`, f);

        if (f) {
            let reader = new FileReader();
            reader.onload = function (e) {
                // noinspection JSUnresolvedVariable
                let view = new Uint8Array(e.target.result);
                for (let i = 0; i < view.length; i++) {
                    data.push(view[i]);
                    if (view[i] === SYSEX_END_BYTE) break;
                }

                // const valid = MODEL.setValuesFromSysEx(data);
                const valid = validate(data);
                if (valid.type === SYSEX_PRESET) {

                    appendMessage(`File ${f.name} read OK`);

                    /*
                                    resetExp();
                                    updateUI();
                                    fullUpdateDevice();
                                    // setPresetClean();
                                    // noinspection JSBitwiseOperatorUsage
                                    if (preferences.update_URL & SETTINGS_UPDATE_URL.on_randomize_init_load) {
                                        updateUrl();
                                    }
                    */

                    // set device ID and preset ID to 0 (to avoid selecting the preset in Enzo when we load the preset from the library)
                    data[4] = 0;
                    data[8] = 0;

                    let n = f.name.substring(0, f.name.lastIndexOf('.')) || f.name;
                    addPresetToLibrary({
                        // id: n.replace('.', '_'), // jQuery does not select if the ID contains a dot
                        id: n,
                        name: n,
                        h: toHexString(data)
                    })

                } else {
                    log("unable to set value from file; file is not a preset sysex", valid);
                    $("#load-preset-error").show().text(valid.message);
                }
            };
            reader.readAsArrayBuffer(f);
        }
    }

    log("file read OK");
    if (lightbox) lightbox.close();

}
