import {log, TRACE, warn} from "./debug";
import {disableKeyboard} from "./ui_keyboard";
import * as lity from "lity";
// import {updateUrl} from "./url";
import store from "storejs";
import MODEL from "./model";
import * as Utils from "./utils";
import {SYSEX_END_BYTE, SYSEX_PRESET, validate} from "./model/sysex";
import {resetExp} from "./ui_exp";
import {updateControls, updateUI} from "./ui";
import {appendMessage} from "./ui_messages";
import {fullUpdateDevice} from "./midi_out";
import {getCurrentZoomLevel} from "./ui_size";
import {toHexString} from "./utils";
import {setPresetDirty} from "./ui_presets";
import JSZip from "jszip";
import { saveAs } from 'file-saver';

/* editor presets (library) */

const LOCAL_STORAGE_KEY = "studiocode.enzo-editor.library";

let edit_preset_dialog = null;

let library = [];

export function setupPresetsLibrary() {

    // $("#menu-download-sysex").click(downloadLastSysEx);
    $("#menu-compact-library").click(compactTheLibrary);
    $("#menu-delete-presets").click(deleteAllPresets);
    $("#menu-download-sysex").click(() => exportSysex(Object.values(library)));
    $("#menu-load-preset").click(loadPresetFromFile);
    $("#menu-import-enzo").click(importFromEnzo);
    $("#menu-copy-to-enzo").click(copyToEnzo);
    $("#preset-file").change((event) => {
        readFiles(event.target.files);
    });     // in load-preset-dialog

    library.fill(null, 0, 15);

    readPresetsFromLocalStorage();

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
}

function readPresetsFromLocalStorage() {
    const s = store.get(LOCAL_STORAGE_KEY);
    log(s);
    library = s ? JSON.parse(s) : Array(16).fill(null) ;
    // log(library);
}

function savePresetsInLocalStorage() {
    // Object.assign(preferences, preferences, options);
    store(LOCAL_STORAGE_KEY, JSON.stringify(library));
}

function deleteAllPresets() {
    if (!window.confirm(`Delete all library presets ?`)) return;
    library = Array(16).fill(null);
    savePresetsInLocalStorage();
    displayPresets();
}

function compactTheLibrary() {
    library = library.filter(e => e);
    for (let i = library.length; i < 16; i++) {
        library.push(null);
    }
    savePresetsInLocalStorage();
    displayPresets();
}

function importFromEnzo() {
    // TODO
}

function copyToEnzo() {
    // TODO
}

function updatePreset() {

    const id = $('#edit-preset-dialog-id').val();

    log("update editor preset", id);

    if (id) {
        let name = $('#edit-preset-dialog-input').val();
        let descr = $('#edit-preset-dialog-description').val();

        console.log("update editor preset name", id, name);
        library[id].name = name;
        library[id].description = descr;

        $(`#name-${id}`).text(name);

        savePresetsInLocalStorage();
    }

    if (edit_preset_dialog) edit_preset_dialog.close();
    edit_preset_dialog = null;

    $('#edit-preset-dialog input').val("");    // reset
}

function editPreset(index) {

    log(`editPreset(${index})`);

    //TODO: allow empty slots in library

    // const p = elem.parents('.preset-editor').first();
    // const n = elem.siblings('.preset-name').first();

    // console.log(p.attr('id'), n.text());
    // console.log(elem.children('.preset-name').first());

    // if (key in library) {
    if (library[index]) {

        disableKeyboard();

        $('#edit-preset-dialog-id').val(library[index].id);
        $('#edit-preset-dialog-input').val(library[index].name);
        $('#edit-preset-dialog-description').val(library[index].description);

        edit_preset_dialog = lity("#edit-preset-dialog");

        // var a = "contenteditable";
        // elem.attr(a) === 'true' ? elem.attr(a,'false') : elem.attr(a, 'true');

        // elem.attr('contenteditable',!elem.attr('contenteditable'));

    }
    return false;
}

function deletePreset(index) {
    log(`deletePreset(#preset-${index})`);
    if (library[index]) {
        if (!window.confirm(`Delete library preset ${library[index].name} ?`)) return;
        if (index) {
            // $(`#preset-${id}`).remove();
            delete (library[index]);
            savePresetsInLocalStorage();
            displayPresets();
        }
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

    // add into first empty slot
    const i = library.findIndex(e => (e === null) || (typeof e === 'undefined'));
    if (i >= 0) {
        library[i] = preset;
    } else {
        library.push(preset);
    }

    savePresetsInLocalStorage();
    displayPresets();
}

function createPresetDOM(preset, index) {

    // preset can be null or undefined because empty slots are OK

    // log("createPresetDOM", index, preset);

    let dom;

    if (preset) {
        let displayLength;
        switch (getCurrentZoomLevel()) {
            case 1: displayLength = 18; break;
            case 2: displayLength = 20; break;
            default: displayLength = 16;
        }
        let name = preset.name;
        if (name.length > displayLength) name = name.substring(0, displayLength) + '...';
        const preset_edit = $(`<i class="fas fa-pen preset-edit" aria-hidden="true"></i>`).click(
            (e) => {
                editPreset(index);
                e.stopPropagation();
            }
        );
        const preset_delete = $(`<i class="fas fa-times preset-delete" aria-hidden="true"></i>`).click(
            (e) => {
                deletePreset(index)
                e.stopPropagation();
            });
        dom = $(`<div/>`, {id: `preset-${index}`, "class": 'preset preset-editor', "draggable": "true"}).click(() => usePreset(preset.id))
                .append($('<div class="preset-name-wrapper">')
                    .append($(`<div/>`, {id: `name-${preset.id}`, "class": "preset-name"}).text(name))
                    .append(preset_edit))
                .append(preset_delete);
    } else {
        dom = $(`<div/>`, {id: `preset-${index}`, "class": 'preset preset-editor', "draggable": "true"})
                .append($('<div class="preset-name-wrapper">')
                    .append($(`<div class="preset-name"></div>`).html('&nbsp;')));
    }

    return dom;
}

/**
 * rebuild the html presets library
 */
function displayPresets() {

    log("displayPresets", library);

    const lib = $(`<div/>`, {id: "presets-lib", "class": "presets-lib flex-grow"});

    library.forEach((preset, index) => lib.append(createPresetDOM(preset, index)));

    // display at least 16 slots:
    // for (let i = library.length; i < 16; i++) {
    //     lib.append(createPresetDOM(null, i));
    // }

    $('#presets-lib').replaceWith(lib);

    setupDnD();
}


function usePreset(id) {

    log(`usePreset(${id})`);

    // if (id in library === false) {
    //     return;
    // }

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

function exportSysex(presets) {

    const zip = new JSZip();

    for (const preset of presets) {
        zip.file(`${preset.name}.syx`, Utils.fromHexString(preset.h));     // will work, JSZip accepts ArrayBuffer
    }

    zip.generateAsync({type:"blob"})
        .then(function (blob) {
            saveAs(blob, "enzo-presets.zip");
        });
}


function downloadLastSysEx() {

    let data = MODEL.getPreset();

    const now = new Date();
    const timestamp =
        now.getUTCFullYear() + "-" +
        ("0" + (now.getUTCMonth()+1)).slice(-2) + "-" +
        ("0" + now.getUTCDate()).slice(-2) + "-" +
        ("0" + now.getUTCHours()).slice(-2) + "h" +
        ("0" + now.getUTCMinutes()).slice(-2) + "m" +
        ("0" + now.getUTCSeconds()).slice(-2) + "s";

    const preset_num = MODEL.meta.preset_id.value;

    let shadowlink = document.createElement('a');
    shadowlink.style.display = 'none';
    shadowlink.download = `${MODEL.name.toLowerCase()}-preset${preset_num ? '-' : ''}${preset_num ? preset_num : ''}.${timestamp}.syx`;

    const blob = new Blob([data], {type: "application/octet-stream"});
    const url = window.URL.createObjectURL(blob);
    shadowlink.href = url;

    document.body.appendChild(shadowlink);
    shadowlink.click();
    document.body.removeChild(shadowlink);
    setTimeout(function() {
        return window.URL.revokeObjectURL(url);
    }, 1000);

    return false;   // disable the normal href behavior when called from an onclick event
}

/* ------------- */

let dragSrcEl = null;
let dragCounter = 0;
let dragOverId = null;
let dragId = null;

function handleDragStart(e) {

    // log("drag start", this.id);

    dragId = this.id;

    this.style.opacity = '0.4';

    dragSrcEl = this;

    const index = this.id.split('-')[1];
    // log("handleDragStart index", index);

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text', `${index}`);
}

function handleDragOver(e) {

    // log("handleDragOver", this, this.classList.contains('preset-editor'));

    // In order to have the drop event occur on a div element, you must cancel the ondragenter and ondragover events.
    e.preventDefault();

    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {

    // log('drag enter', this.id, dragId, e.target.classList.contains('preset-editor'))

    dragCounter++;

    // log("HANDLEDRAGENTER", dragCounter, this.id, dragOverId, JSON.stringify(e.target.classList));

    // In order to have the drop event occur on a div element, you must cancel the ondragenter and ondragover events.
    e.preventDefault();

    // if ((this.id !== dragId) && e.target.classList.contains('preset-editor')) {
    if (this.id !== dragId) {

        // log("ENTER", this.id, dragCounter, dragId, dragOverId, JSON.stringify(e.target.classList));
        // log("enter", this.id);

        // if (dragOverId) document.getElementById(dragOverId).classList.remove('over');

        $('#presets-lib .preset-editor').removeClass('over');
        this.classList.add('over');
        // log("add .over", this.id);
        dragOverId = this.id;
    }

}

function handleDragLeave(e) {

    dragCounter--;
    // log("leave", this.id);

    // log("handleDragLeave", dragCounter, this.id, dragOverId, JSON.stringify(e.target.classList));
    // log("handleDragLeave", e, this.id, this.classList.contains('preset-editor'));

    if ((this.id !== dragId) && dragCounter === 0) {    // && e.target.classList.contains('preset-editor')) {

        // log("leave", this.id);  //, dragCounter, dragId, dragOverId, JSON.stringify(e.target.classList));

        // log("remove .over", this.id);
        this.classList.remove('over');
    }
}

function handleDrop(e) {

    // log("drop", this.id); //, library);

    // log("handleDrop", dragSrcEl);

    if (e.stopPropagation) {
        e.stopPropagation();
    }

    if (dragSrcEl !== this) {

        const indexTarget = this.id.split('-')[1];
        // log("handleDrop id, index", this.id, indexTarget);

        // dragSrcEl.innerHTML = this.innerHTML;
        // this.innerHTML = e.dataTransfer.getData('text/html');
        const indexSource = e.dataTransfer.getData('text');

        // log("handleDrop swap", indexSource, indexTarget);

        [library[indexSource], library[indexTarget]] = [library[indexTarget], library[indexSource]];

        // log("handleDrop result", library);

    } else {
        log('ignore drop');
    }

    return false;
}

function handleDragEnd(e) {

    // log("drag end");

    this.style.opacity = '1';

    itemsDnD.forEach(function (item) {
        item.classList.remove('over');
    });

    savePresetsInLocalStorage();

    displayPresets();
}

let itemsDnD;

function setupDnD() {
    itemsDnD = document.querySelectorAll('#presets-lib .preset-editor');
    itemsDnD.forEach(function (item) {
        // log("Dnd init for", item);
        item.addEventListener('dragstart', handleDragStart, false);
        item.addEventListener('dragenter', handleDragEnter, false);
        item.addEventListener('dragover', handleDragOver, false);
        item.addEventListener('dragleave', handleDragLeave, false);
        item.addEventListener('drop', handleDrop, false);
        item.addEventListener('dragend', handleDragEnd, false);
    });
}


