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

export function readStorage() {
    const s = store.get(LOCAL_STORAGE_KEY);
    if (s) library = JSON.parse(s);
}

export function updateStorage() {
    // Object.assign(preferences, preferences, options);
    store(LOCAL_STORAGE_KEY, JSON.stringify(library));
}

export function setupPresetsLibrary() {

    // $("#menu-download-sysex").click(downloadLastSysEx);
    $("#menu-download-sysex").click(() => exportSysex(Object.values(library)));
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

    log("update editor preset", id);

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

function editPreset(index) {

    log(`editPreset(${index})`);

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
            updateStorage();
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

    // library[preset.id] = preset;    // JS automatically convert the key to string type
    library.push(preset);

    updateStorage();

    //TODO:
    // 1. get name
    // 2. save name and sysex in local storage
    // 3. format for display (cut if > 16 chars)
    // When edit:
    // - get name from local storage

/*
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
*/

    displayPresets();
}

function createPresetDOM(preset, index) {

    // log("createPresetDOM", index, preset);

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
    const p =
        $(`<div/>`, {id: `preset-${index}`, "class": 'preset preset-editor', "draggable": "true"}).click(() => usePreset(preset.id))
            .append($('<div class="preset-name-wrapper">')
                .append($(`<div/>`, {id: `name-${preset.id}`, "class": "preset-name"}).text(name))
                .append(preset_edit))
            .append(preset_delete);
    return p;
}

function createPresetPlaceholderDOM(index) {
    const p =
        $(`<div/>`, {id: `preset-${index}`, "class": 'preset preset-editor', "draggable": "true"})
            .append($('<div class="preset-name-wrapper">')
                .append($(`<div class="preset-name"></div>`).html('&nbsp;'))
            );
    return p;
}

/**
 * rebuild the html presets library
 */
function displayPresets() {

    log("displayPresets");

    const lib = $(`<div/>`, {id: "presets-lib", "class": "presets-lib flex-grow"});

    // let i = 0;
    // for (const [key, value] of Object.entries(library)) {
    //     i++;
    //     lib.append(createPresetDOM(value));
    // }
    // for (let preset of library) {
    //     i++;
    //     lib.append(createPresetDOM(preset));
    // }

    library.forEach((preset, index) => lib.append(createPresetDOM(preset, index)));

    for (let i = library.length; i < 16; i++) {
        lib.append(createPresetPlaceholderDOM(i));
    }

    $('#presets-lib').replaceWith(lib);

    // DnD

    // setupDnD( document.getElementById('presets-lib'), function (item) {
    //     log("dnd item", item);
    // });

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
    log("handleDragStart", this, this.id);

    dragId = this.id;

    this.style.opacity = '0.4';

    dragSrcEl = this;

    const index = this.id.split('-')[1];
    log("handleDragStart index", index);

    e.dataTransfer.effectAllowed = 'move';
    // e.dataTransfer.setData('text/html', this.innerHTML);
    e.dataTransfer.setData('text', `${index}`);
}

function handleDragOver(e) {

    // log("handleDragOver", this, this.classList.contains('preset-editor'));



    // if (!this.classList.contains('preset-editor')) {
    //     // e.stopPropagation();
    //     e.preventDefault();
    // }

    // In order to have the drop event occur on a div element, you must cancel the ondragenter and ondragover events.

    e.preventDefault();


    // if (e.preventDefault) {
    //     e.preventDefault();
    // }

    e.dataTransfer.dropEffect = 'move';

    return false;
}

function handleDragEnter(e) {

    dragCounter++;


    // log("HANDLEDRAGENTER", dragCounter, this.id, dragOverId, JSON.stringify(e.target.classList));

    // if (e.preventDefault) {
        e.preventDefault();
    // }
    if ((this.id !== dragId) && e.target.classList.contains('preset-editor')) {

        log("ENTER", this.id, dragCounter, dragId, dragOverId, JSON.stringify(e.target.classList));

        if (dragOverId) document.getElementById(dragOverId).classList.remove('over');

        this.classList.add('over');
        log("add .over", this.id);
        dragOverId = this.id;
    }

}

function handleDragLeave(e) {

    dragCounter--;

    // log("handleDragLeave", dragCounter, this.id, dragOverId, JSON.stringify(e.target.classList));
    // log("handleDragLeave", e, this.id, this.classList.contains('preset-editor'));

    if ((this.id !== dragId) && dragCounter === 0 && e.target.classList.contains('preset-editor')) {

        log("leave", this.id, dragCounter, dragId, dragOverId, JSON.stringify(e.target.classList));

        log("remove .over", this.id);
        this.classList.remove('over');
    }
}

function handleDrop(e) {

    log("handleDrop", this.id, library);

    // log("handleDrop", dragSrcEl);

    if (e.stopPropagation) {
        e.stopPropagation(); // stops the browser from redirecting.
    }

    if (dragSrcEl != this) {

        const indexTarget = this.id.split('-')[1];
        log("handleDrop id, index", this.id, indexTarget);

        // dragSrcEl.innerHTML = this.innerHTML;
        // this.innerHTML = e.dataTransfer.getData('text/html');
        const indexSource = e.dataTransfer.getData('text');

        log("handleDrop swap", indexSource, indexTarget);


        [library[indexSource], library[indexTarget]] = [library[indexTarget], library[indexSource]];

        log("handleDrop result", library);

    }

    return false;
}

function handleDragEnd(e) {

    log("handleDragEnd");

    this.style.opacity = '1';

    itemsDnD.forEach(function (item) {
        item.classList.remove('over');
    });

    //RTODO: save presets in local storage

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

/* ------------- */

/*
function dragStart(ev) {
    ev.target.classList.add('dragging')
    ev.dataTransfer.setData("text/plain", ev.target.id);
    ev.dataTransfer.dropEffect = "copy";
}
function drop(ev) {
    ev.preventDefault();
    var draggableId = ev.dataTransfer.getData("text");
    var droppable = ev.currentTarget;
    var draggable = document.getElementById(draggableId)
    draggable.classList.remove('dragging')
    var droppableArea = window.getComputedStyle(droppable).gridArea;
    var draggableArea = window.getComputedStyle(draggable).gridArea;
    draggable.style.gridArea = droppableArea;
    droppable.style.gridArea = draggableArea;
    console.log(draggable.id, '====>', droppableArea)
    console.log(droppable.id, '====>', draggableArea)
}
function dragover(ev) {
    ev.preventDefault();
}

function setupDnD() {
    var els = document.getElementsByClassName("preset-editor");
    var c = 1;
    Array.prototype.forEach.call(els, function (e) {
        e.draggable = true
        e.ondragstart = dragStart
        e.ondrop = drop
        e.ondragover = dragover
        // if(e.id == "") {
        //     e.id = "_editable_" + c;
        //     c++
        // }
    })
}

// setup()
*/

/*
function setupDnD(section, onUpdate){

    var dragEl, nextEl, newPos, dragGhost;

    let oldPos = [...section.children].map(item => {
        item.draggable = true
        let pos = document.getElementById(item.id).getBoundingClientRect();
        return pos;
    });

    function _onDragOver(e) {

        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        var target = e.target;

        // console.log("target", target);

        if( target && target !== dragEl && target.nodeName == 'DIV' ){
            if(!target.classList.contains('preset-editor')) {
                e.stopPropagation();
            } else {
                //getBoundinClientRect contains location-info about the element (relative to the viewport)
                let targetPos = target.getBoundingClientRect();

                //checking that dragEl is dragged over half the target y-axis or x-axis. (therefor the .5)
                let next = (e.clientY - targetPos.top) / (targetPos.bottom - targetPos.top) > .5 || (e.clientX - targetPos.left) / (targetPos.right - targetPos.left) > .5;

                // console.log("target over: next", next);
                console.log("target", target);
                console.log("nextSibling", target.nextSibling);

                section.insertBefore(dragEl, next && target.nextSibling || target);

                /!*  console.log("oldPos:" + JSON.stringify(oldPos));
                 console.log("newPos:" + JSON.stringify(newPos)); *!/
                // console.log(newPos.top === oldPos.top ? 'They are the same' : 'Not the same');

                // console.log("oldPos", oldPos);
            }
        }
    }

    function _onDragEnd(evt){
        evt.preventDefault();
        newPos = [...section.children].map(child => {
            let pos = document.getElementById(child.id).getBoundingClientRect();
            return pos;
        });
        // console.log(newPos);
        dragEl.classList.remove('ghost');
        section.removeEventListener('dragover', _onDragOver, false);
        section.removeEventListener('dragend', _onDragEnd, false);

        nextEl !== dragEl.nextSibling ? onUpdate(dragEl) : false;
    }

    // section.addEventListener('dragstart', function(e) {

    const els = document.getElementsByClassName("preset-editor");
    Array.prototype.forEach.call(els, function (e) {

        e.addEventListener('dragstart', function(e){

            // console.log("dragStart", e.target, e);

            dragEl = e.target;
            nextEl = dragEl.nextSibling;

            /!* dragGhost = dragEl.cloneNode(true);
            dragGhost.classList.add('hidden-drag-ghost'); *!/

            /!*  document.body.appendChild(dragGhost);
             e.dataTransfer.setDragImage(dragGhost, 0, 0); *!/

            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('Text', dragEl.textContent);

            section.addEventListener('dragover', _onDragOver, false);
            section.addEventListener('dragend', _onDragEnd, false);

            setTimeout(function () {dragEl.classList.add('ghost');}, 0);

        });


        //     e.draggable = true
        // e.ondragstart = dragStart
        // e.ondrop = drop
        // e.ondragover = dragover
        // // if(e.id == "") {
        // //     e.id = "_editable_" + c;
        // //     c++
        // // }
    })

/!*
    $('.preset-editor').on('dragstart', function(e) {

        console.log("dragStart", e.target, e);

        dragEl = e.target;
        nextEl = dragEl.nextSibling;

        /!* dragGhost = dragEl.cloneNode(true);
        dragGhost.classList.add('hidden-drag-ghost'); *!/

        /!*  document.body.appendChild(dragGhost);
         e.dataTransfer.setDragImage(dragGhost, 0, 0); *!/

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('Text', dragEl.textContent);

        section.addEventListener('dragover', _onDragOver, false);
        section.addEventListener('dragend', _onDragEnd, false);

        setTimeout(function (){
            dragEl.classList.add('ghost');
        }, 0)

    });
*!/

}
*/


