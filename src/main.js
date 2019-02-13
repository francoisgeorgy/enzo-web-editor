import DEVICE from "./enzo/enzo.js";
import Knob from "svg-knob";
// import * as Utils from "./lib/utils.js";
import * as WebMidi from "webmidi";
// CSS order is important
import * as lity from "lity";
import "./css/lity.min.css";
import "./css/main.css";
import "./css/grid.css";
import "./css/layout.css";
import "./css/knob.css";
import {detect} from "detect-browser";
import { fromEvent } from 'rxjs'
import { groupBy, merge, map, mergeAll, distinctUntilChanged } from 'rxjs/operators';
import {KNOB_CONF} from "./conf";

const TRACE = true;    // when true, will log more details in the console
const VERSION = "[AIV]{version}[/AIV]";
const URL_PARAM_SYSEX = "sysex";    // name of sysex parameter in the query-string

let midi_input = null;
let midi_output = null;
let midi_channel = "all";
let knobs = {};         // svg-knob
let zoom_level = 1;     // 0 = S, 1 = M, 2 = L

const browser = detect();

if (browser) {
    if (TRACE) console.log(browser.name);
    if (TRACE) console.log(browser.version);
    switch (browser && browser.name) {
        case "chrome":
            if (TRACE) console.log("supported browser");
            break;
        case "firefox":
        case "edge":
        default:
            if (TRACE) console.log("unsupported browser");
            alert("Please use Chrome browser (recent version recommended). " +
                "Any other browser is unsupported at the moment and the application may not work properly or not work at all. " +
                "Thank you for your understanding.");
    }
}

/**
 * Makes the app name glows, or not.
 * @param status
 */
function setMidiInStatus(status) {
    if (status) {
        $(".neon").addClass("glow");
    } else {
        $(".neon").removeClass("glow");
    }
}

// function setMidiOutStatus(status) {
//     // toggleOnOff("#midi-out-status", status);
// }

function setStatus(msg) {
    $("#status").removeClass("error").text(msg);
    if (TRACE) console.log(msg);
}

function setStatusError(msg) {
    $("#status").addClass("error").text(msg);
}

function applyZoom() {
    console.log("applyZoom", zoom_level);
    $("#main").removeClass("zoom-0 zoom-1 zoom-2").addClass(`zoom-${zoom_level}`)
}

function zoomIn() {
    if (zoom_level === 2) return;
    zoom_level++;
    applyZoom();
}

function zoomOut() {
    if (zoom_level === 0) return;
    zoom_level--;
    applyZoom();
}

//
// Popup to display MIDI messages
//
var midi_window = null;

//
// Count the number of messages displayed in the MIDI window.
//
let midi_in_messages = 0;
let midi_out_messages = 0;

/**
 *
 * @param type
 * @param control
 * @param value
 */
function logIncomingMidiMessage(type, control, value) {
    if (midi_window) {
        const ctrl = parseInt(control);
        const v = parseInt(value);
        midi_in_messages++;
        // log at max 1000 messages:
        if (midi_in_messages > 1000) $("#midi-messages-in div:last-child", midi_window.document).remove();
        let s = type + " " +
            ctrl.toString(10).padStart(3, "0") + " " +
            v.toString(10).padStart(3, "0") + " (" +
            ctrl.toString(16).padStart(2, "0") + " " +
            v.toString(16).padStart(2, "0") + ")";
        $("#midi-messages-in", midi_window.document).prepend(`<div>${s.toUpperCase()}</div>`);
    }
}

/**
 *
 * @param type
 * @param control
 * @param value
 */
function logOutgoingMidiMessage(type, control, value) {
    if (midi_window) {
        const ctrl = parseInt(control);
        const v = parseInt(value);
        midi_out_messages++;
        // log at max 1000 messages:
        if (midi_out_messages > 1000) $("#midi-messages-out div:last-child", midi_window.document).remove();
        let s = '';
        if (type === 'CC') {
            s = type + " " +
                ctrl.toString(10).padStart(3, "0") + " " +
                v.toString(10).padStart(3, "0") + " (" +
                ctrl.toString(16).padStart(2, "0") + " " +
                v.toString(16).padStart(2, "0") + ")";
        } else if (type === 'PC') {
            s = type + " " +
                ctrl.toString(10).padStart(3, "0") + " " +
                ctrl.toString(16).padStart(2, "0");
        } else {
            s = 'unknown message'
        }
        $("#midi-messages-out", midi_window.document).prepend(`<div>${s.toUpperCase()}</div>`);
    }
}

//==================================================================================================================

/**
 * Get a link for the current preset
 *
 */
/*
function getCurrentPresetAsLink() {
    // window.location.href.split("?")[0] is the current URL without the query-string if any
    return window.location.href.replace("#", "").split("?")[0] + "?" + URL_PARAM_SYSEX + "=" + Utils.toHexString(DEVICE.getSysEx());
}
*/

//==================================================================================================================
// Midi messages handling

let preset_number = 0;

function displayPreset() {
    $(".preset-id").removeClass("on");
    $(`#pc-${preset_number}`).addClass("on");
}

function presetInc() {
    if (TRACE) console.log("presetInc");
    // preset_number = (preset_number % 16) + 1;
    // displayPresetNumber();
    sendPC((preset_number % 16) + 1);
    displayPreset();
    // requestSysExDump();
}

function presetDec() {
    if (TRACE) console.log("presetDec");
    // if (preset_number === -1) preset_number = 1;
    preset_number--;
    if (preset_number < 1) preset_number = 16;
    // displayPresetNumber();
    sendPC(preset_number);
    displayPreset();
    // requestSysExDump();
}

function sendPC(pc) {
    preset_number = pc;
    if (midi_output) {
        if (TRACE) console.log(`send program change ${preset_number}`);
        midi_output.sendProgramChange(preset_number, midi_channel);
    }
    logOutgoingMidiMessage("PC", preset_number);
}

/**
 * Handle Program Change messages
 * @param e
 */
function handlePC(e) {

    if (TRACE) console.log("receive PC", e);

    if (e.type !== "programchange") return;

    logIncomingMidiMessage("PC", 0, e.value);

    //TODO: update value in DEVICE

    preset_number = e.value;
    // displayPresetNumber();
    // requestSysExDump();
}

/**
 * Handle all control change messages received
 * @param e
 */
function handleCC(e) {

    let msg = e.data;   // Uint8Array
    let cc = msg[1];
    // let value = -1;

    if (TRACE) console.log("receive CC", cc, msg[2]);

    logIncomingMidiMessage("CC", cc, msg[2]);

    if (DEVICE.control[cc]) {
        // if (DEVICE.control[cc].lsb === -1) {
            let v = msg[2];
            dispatch("cc", cc, v);
        // } else {
        //     cc_expected = DEVICE.control[cc].lsb;
        //     cc_msb = cc;
        //     value_msb = msg[2];
        // }
    } else {
        console.warn(`unsupported CC: ${cc}`)
    }

}

/**
 * Update DEVICE and associated on-screen control from CC or NRPN value.
 *
 * @param control_type
 * @param control_number
 * @param value
 *
 * Return the device's control
 */
function dispatch(control_type, control_number, value) {

    if (TRACE) console.log("dispatch", control_type, control_number, value, "#" + control_type + "-" + control_number);

    control_type = control_type.toLowerCase();

    if ((control_type !== "cc") && (control_type !== "nrpn")) return; //TODO: signal an error

    let control = DEVICE.setControlValue(control_type, control_number, value);  // return a handle on the device control; may be useful later

    updateControl(control_type, control_number, value);

    return control;
}

/**
 *
 * @param id
 * @param value
 */
function updateOptionSwitch(id, value) {
    // "radio button"-like behavior
    if (TRACE) console.log(`updateOptionSwitch(${id}, ${value})`);
    let e = $("#" + id);
    if (TRACE) console.log(e);
    if (!e.is(".on")) {   // if not already on...
        e.siblings(".bt").removeClass("on");
        e.addClass("on");
        // handleUIChange(...c.split("-"), v);
        // handleUIChange(...this.id.split("-"));
    }
}

/**
 *
 * @param control_type
 * @param control_number
 * @param value
 */
function updateControl(control_type, control_number, value) {

    if (TRACE) console.log(`updateControl(${control_type}, ${control_number}, ${value})`);

    const id = control_type + "-" + control_number;
    if (knobs.hasOwnProperty(id)) {
        knobs[id].value = value;
    } else {
        // if (TRACE) console.log(`check #${id}`);

        let c = $(`#${id}`);
        // c.val(value).trigger("blur");

        if (c.length) {
            console.warn("updateControl: unsupported control: ", control_type, control_number, value);
/*
            if (c.is(".svg-slider,.svg-slider-env")) {
                updateSVGSlider(id, value);
            } else if (c.is(".slider")) {
                updateSlider(id, value);
            } else if (c.is(".btc")) {
                updateToggleSwitch(id, value);
            } else {
                c.val(value).trigger("blur");
            }
*/
        } else {
            c = $(`#${id}-${value}`);
            if (c.length) {
                if (TRACE) console.log("updateControl:", c);
                if (c.is(".bt")) {
                    updateOptionSwitch(id + "-" + value, value);
                } else {
                    console.warn("updateControl: unsupported control: ", control_type, control_number, value);
                    // c.val(value).trigger("blur");
                }
            } else {
                console.warn(`no control for ${id}-${value}`);
            }
        }

    }

}

//==================================================================================================================
// Updating to the connected device

/**
 * Send a control value to the connected device.
 * @param control
 */
function sendCC(control) {

    let a = DEVICE.getMidiMessagesForCC(control);

    for (let i=0; i<a.length; i++) {
        if (midi_output) {
            if (TRACE) console.log(`send CC ${a[i][0]} ${a[i][1]} (${control.name}) on MIDI channel ${midi_channel}`);
            midi_output.sendControlChange(a[i][0], a[i][1], midi_channel);
        } else {
            if (TRACE) console.log(`(send CC ${a[i][0]} ${a[i][1]} (${control.name}) on MIDI channel ${midi_channel})`);
        }
        logOutgoingMidiMessage("CC", a[i][0], a[i][1]);
    }
}

/**
 * Send all values to the connected device
 */
function updateConnectedDevice(onlyChanged = false) {
    console.log("TODO: updateConnectedDevice()");
}

//==================================================================================================================

/**
 * Update the virtual DEVICE and the connected device.
 * Note: jQuery Knob transmits the value as a float
 *
 * Called by the onChange handlers of dials, switches and selects.
 *
 * @param control_type
 * @param control_number
 * @param value_float
 */
function updateDevice(control_type, control_number, value_float) {

    let value = Math.round(value_float);

    if (TRACE) console.log("updateDevice", control_type, control_number, value_float, value);

    sendCC(DEVICE.setControlValue(control_type, control_number, value));
}

/**
 * Handles a change made by the user in the UI.
 */
function handleUserAction(control_type, control_number, value) {

    if (TRACE) console.log(`handleUserAction(${control_type}, ${control_number}, ${value})`);

    // if (control_type==='cc' && (control_number===28 || control_number===71)) {
    //     console.log(`${control_type}-${control_number}: ${value}`);
    // }

    if (control_type === 'pc') {
        sendPC(control_number);
    } else {
        updateDevice(control_type, control_number, value);
    }

    // if (control_type === "cc") {
    //     if (["102", "103", "104", "105"].includes(control_number)) {
    //         envelopes["mod-envelope"].envelope = DEVICE.getADSREnv("mod");
    //     } else if (["90", "91", "92", "93"].includes(control_number)) {
    //         if (TRACE) console.log("redraw amp env", envelopes);
    //         envelopes["amp-envelope"].envelope = DEVICE.getADSREnv("amp");
    //     }
    // }

}

//==================================================================================================================

/**
 *
 */
function init(sendUpdate = true) {
    if (TRACE) console.group(`init(${sendUpdate})`);
    DEVICE.init();
    updateUI(true);
    // setStatus(`init done`);
    if (sendUpdate) updateConnectedDevice();
    if (TRACE) console.log(`init done`);
    if (TRACE) console.groupEnd();
    return false;   // disable the normal href behavior
}

/**
 *
 */
function randomize() {
    if (TRACE) console.group("randomize");
    // if (settings.randomize.length < 1) {
    //     alert("Nothing to randomize.\nUse the \"Settings\" menu to configure the randomizer.");
    // } else {
        DEVICE.randomize(settings.randomize);
        updateUI();
        updateConnectedDevice(true);    // true == update only updated values (values which have been marked as changed)
    // }
    if (TRACE) console.groupEnd();
    return false;   // disable the normal href behavior
}

//==================================================================================================================

/**
 * Set value of the controls (input and select) from the DEVICE values
 */
function updateControls() {
    console.log("updateControls()");

    for (let i=0; i < DEVICE.control.length; i++) {
        if (typeof DEVICE.control[i] === "undefined") continue;
        updateControl(DEVICE.control[i].cc_type, i, DEVICE.getControlValue(DEVICE.control[i]));
    }

} // updateControls()

/**
 *
 */
function setupKnobs() {

    console.log("setupKnobs()");

    for (let i=0; i < DEVICE.control.length; i++) {

        const c = DEVICE.control[i];
        if (typeof c === "undefined") {
            console.log("device undefined", i);
            continue;
        }

        const id = `${c.cc_type}-${c.cc_number}`;
        const v = DEVICE.getControlValue(DEVICE.control[i]);

        let elem = document.getElementById(id);
        if (elem === null) {
            console.warn(`setupKnobs: element not found for id ${id}`);
            continue;
        }
        if (!elem.classList.contains("knob")) return;

        if (TRACE) console.log(`configure #${id}: range=${c.cc_range}, init-value=${v}`);

        // knobs[id] = new Knob(elem, Object.assign({}, KNOB_CONF, {
        //     value_min: Math.min(...c.cc_range),
        //     value_max: Math.max(...c.cc_range),
        //     default_value: v,
        //     center_zero: Math.min(...c.range) < 0,
        //     center_value: c.hasOwnProperty("cc_center") ? c.cc_center : c.init_value,
        //     format: v => c.human(v)
        // }));
        knobs[id] = new Knob(elem, KNOB_CONF);
        knobs[id].config = {
            value_min: Math.min(...c.cc_range),
            value_max: Math.max(...c.cc_range),
            default_value: v,
            center_zero: Math.min(...c.range) < 0,
            center_value: c.hasOwnProperty("cc_center") ? c.cc_center : c.init_value,
            format: v => c.human(v)
        };
        knobs[id].disableDebug();

        elem.addEventListener("change", function(event) {
            handleUserAction(c.cc_type, c.cc_number, event.detail);
        });
    }

} // setupKnobs


function setupPresetSelectors() {

    console.log("setupPresetSelectors()");

    $("div#pc-down").click(function() {
        if (TRACE) console.log(`click on ${this.id}`);
        // if (!this.classList.contains("on")) {   // if not already on...
        //     $(this).siblings(".preset-id").removeClass("on");
        //     this.classList.add("on");
        //     // handleUserAction(...c.split("-"), v);
        //     handleUserAction(...this.id.split("-"));
        // }
        presetDec();
    });

    $("div#pc-up").click(function() {
        if (TRACE) console.log(`click on ${this.id}`);
        // if (!this.classList.contains("on")) {   // if not already on...
        //     $(this).siblings(".preset-id").removeClass("on");
        //     this.classList.add("on");
        //     // handleUserAction(...c.split("-"), v);
        //     handleUserAction(...this.id.split("-"));
        // }
        presetInc();
    });

    $("div.preset-id").click(function() {
        if (TRACE) console.log(`click on ${this.id}`);
        if (!this.classList.contains("on")) {   // if not already on...
            $(this).siblings(".preset-id").removeClass("on");
            this.classList.add("on");
            // handleUserAction(...c.split("-"), v);
            handleUserAction(...this.id.split("-"));
        }
    });

}

/**
 *
 */
function setupSwitches() {

    console.log("setupSwitches()");

    // "radio button"-like behavior:
    $("div.bt").click(function() {
        if (TRACE) console.log(`click on ${this.id}`);
        if (!this.classList.contains("on")) {   // if not already on...
            $(this).siblings(".bt").removeClass("on");
            this.classList.add("on");
            // handleUserAction(...c.split("-"), v);
            handleUserAction(...this.id.split("-"));
        }
    });

    // stompswitches:
    $(".sw").click(function() {
        if (TRACE) console.log(`click on ${this.id}`, this.classList);

        // this.classList.remove("sw-on");
        this.classList.add("sw-off");

        // if (this.classList.contains("sw-off")) {
        $(this).siblings(".sw").removeClass("sw-off");
        //     $(this).siblings(".sw").addClass("sw-on");
            // this.classList.remove("sw-off");
            // handleUserAction(...c.split("-"), v);
        handleUserAction(...this.id.split("-"));
        // }
        // if (TRACE) console.log(`click end`, this.classList);
    });

    // momentary stompswitches:
    $(".swm").mousedown(function() {
        // if (TRACE) console.log(`mousedown on ${this.id}`, this.classList);
        const i = this.id;
        $(`#${i}-off`).addClass("sw-off");
        $(`#${i}-on`).removeClass("sw-off");    //.addClass("sw-on");
        handleUserAction(...this.id.split("-"));
    });

    $(".swm").mouseup(function() {
        // if (TRACE) console.log(`mousedown on ${this.id}`, this.classList);
        const i = this.id;
        $(`#${i}-off`).removeClass("sw-off");
        $(`#${i}-on`).addClass("sw-off");
    });

}

function setupSelects() {
    $("#zoom-0ize").change((event) => setLayoutSize(event.target.value));
    $("#midi-channel").change((event) => setMidiChannel(event.target.value));
    $("#midi-input-device").change((event) => setInputDevice(event.target.value));
    $("#midi-output-device").change((event) => setOutputDevice(event.target.value));
}

function updateSelectDeviceList() {
    $("#midi-input-device").empty().append($("<option>").val("").text("- select -"));
    $("#midi-input-device").append(
        WebMidi.inputs.map((port, index) => {
            return $("<option>").val(port.id).text(`${port.name}`);
        })
    );
    $("#midi-output-device").empty().append($("<option>").val("").text("- select -"));
    $("#midi-output-device").append(
        WebMidi.outputs.map((port, index) => {
            return $("<option>").val(port.id).text(`${port.name}`);
        })
    );
}

/**
 * Update the UI from the DEVICE controls values.
 */
function updateUI() {
    updateControls();
    if (TRACE) console.log("updateUI done");
}

/**
 * Initial setup of the UI.
 * Does a DEVICE.init() too, but only the virtual DEVICE; does not send any CC to the connected device.
 */
function setupUI() {

    console.groupCollapsed("setupUI");

    $("span.version").text(VERSION);

    setMidiInStatus(false);
    // setMidiOutStatus(false);

    setupSettings();    // must be done before loading the settings
    loadSettings();

    setupKnobs();
    setupPresetSelectors();
    setupSwitches();
    setupMenu();
    setupSelects();

    setupKeyboard();

    console.groupEnd();
}

//==================================================================================================================
// Favorites dialog

let default_favorite_name = "";

function getFavorites() {
}

function refreshFavoritesList() {
}

/**
 * Add the current preset to the list of favorites preset in the local storage
 */
function addToFavorites() {
    return false;   // disable the normal href behavior
}

function openFavoritesPanel() {
    return false;   // disable the normal href behavior
}

function closeFavoritesPanel() {
}

function reloadWithPresetUrl() {
    return false;   // disable the normal href behavior
}

//==================================================================================================================
// Settings

function openSettingsPanel() {
    if (TRACE) console.log("toggle settings-panel");
    return false;   // disable the normal href behavior
}

function closeSettingsPanel() {
    if (TRACE) console.log("closeSettingsPanel");
    $("#settings-panel").hide("slide", { direction: "left" }, 500);
}

//==================================================================================================================
// Preset file handling

var lightbox = null;    // lity dialog

/**
 *
 */
function loadPresetFromFile() {
    // $("#load-preset-error").empty();
    $("#preset-file").val("");
    lightbox = lity("#load-preset-dialog");
    return false;   // disable the normal href behavior
}

/**
 *
 */
function savePresetToFile() {
    return false;   // disable the normal href behavior
}

/**
 * Handler for the #preset-file file input element in #load-preset
 */
function readFile() {

    const SYSEX_END = 0xF7;

    let data = [];
    let f = this.files[0];
    if (TRACE) console.log(`read file`, f);

    if (f) {
        let reader = new FileReader();
        reader.onload = function (e) {
            let view   = new Uint8Array(e.target.result);
            for (let i=0; i<view.length; i++) {
                data.push(view[i]);
                if (view[i] === SYSEX_END) break;
            }
            if (DEVICE.setValuesFromSysEx(data)) {
                if (TRACE) console.log("file read OK");
                if (lightbox) lightbox.close();

                updateUI();
                updateConnectedDevice();

            } else {
                console.log("unable to set value from file");
                $("#load-preset-error").show().text("The file is invalid.");
            }
        };
        reader.readAsArrayBuffer(f);
    }
}

/**
 *
 * @returns {boolean}
 */
function openHelpDialog() {
    lightbox = lity("#help-dialog");
    return false;   // disable the normal href behavior
}

/**
 *
 * @returns {boolean}
 */
function openCreditsDialog() {
    lightbox = lity("#credits-dialog");
    return false;   // disable the normal href behavior
}

//==================================================================================================================
// UI main commands (buttons in header)

function printPreset() {
    if (TRACE) console.log("printPreset");
    let url = "print.html?" + URL_PARAM_SYSEX + "=" + encodeURIComponent(LZString.compressToBase64(Utils.toHexString(DEVICE.getSysEx())));
    window.open(url, "_blank", "width=800,height=600,location,resizable,scrollbars,status");
    return false;   // disable the normal href behavior
}

/**
 * header"s "sync" button handler
 */
function syncUIwithDEVICE() {
    // ask the DEVICE to send us its current preset:
    // requestSysExDump();
    return false;   // disable the normal href behavior
}

/**
 * header"s "midi channel" select handler
 */
function setMidiChannel(channel) {
    console.log("setMidiChannel", channel);
    disconnectInput();
    midi_channel = channel;
    connectInput(midi_input);
}

/**
 *
 * @returns {boolean}
 */
function openMidiWindow() {
    midi_window = window.open("midi.html", "_midi", "location=no,height=480,width=350,scrollbars=yes,status=no");
    return false;   // disable the normal href behavior
}

function setLayoutSize(size) {
    console.log(`setLayoutSize(${size})`);
    $("#main").removeClass("zoom-0 zoom-1 zoom-2").addClass(size);
}


function toggleBypass() {
    const c = DEVICE.control[DEVICE.control_id.bypass];
    const v = DEVICE.getControlValue(c) === 0 ? 127 : 0;
    updateDevice(c.cc_type, c.cc_number, v);
    if (v === 0) {
        $("#cc-14-0").addClass("sw-off");
        $("#cc-14-127").removeClass("sw-off");
    } else {
        $("#cc-14-127").addClass("sw-off");
        $("#cc-14-0").removeClass("sw-off");
    }
}

function animateControl() {
    $({ n: 0 }).animate({ n: 10}, {
        duration: 2000,
        step: function(now) {
            console.log(now);
        }
    });
}

/**
 * https://codepen.io/fgeorgy/pen/NyRgxV?editors=1010
 */
function setupKeyboard() {

    let keyDowns = fromEvent(document, "keydown");
    let keyUps = fromEvent(document, "keyup");

    let keyPresses = keyDowns.pipe(
        merge(keyUps),
        groupBy(e => e.keyCode),
        map(group => group.pipe(distinctUntilChanged(null, e => e.type))),
        mergeAll()
    );

    // var keyPresses = keyDowns
    //     .merge(keyUps)
    //     .groupBy(e => e.keyCode)
    //     .map(group => group.distinctUntilChanged(null, e => e.type))
    //     .mergeAll()

    keyPresses.subscribe(function(e) {
        //console.log(e.type, e.key || e.which, e.keyIdentifier);
        // if (TRACE) console.log(e.keyCode, e.type, e.altKey, e.shiftKey, e);
        if (e.type === "keydown") {
            keyDown(e.keyCode, e.altKey, e.shiftKey);
        } else if (e.type === "keyup") {
            keyUp(e.keyCode, e.altKey, e.shiftKey);
        }
    });

    if (TRACE) console.log("keyboard set up");

}

function keyDown(code, alt, shift) {

    console.log(code);

    if (code === 48) {   // 0
        preset_number = 10;
        displayPreset();
        return;
    }

    if ((code >= 49) && (code <= 57)) {   // 1..9
        preset_number = code - 48;
        displayPreset();
        return;
    }

    if ((code >= 65) && (code <= 70)) {   // A..F
        preset_number = code - 65 + 10 + 1;
        displayPreset();
        return;
    }

    switch (code) {
        case 27:                // ESC
            animateControl();
            break;
        case 32:                // SPACE
            toggleBypass();
            break;
        // case 65:                // A
        // case 66:                // B
        // case 67:                // C
        // case 68:                // D
        // case 69:                // E
        // case 70:                // F
        // case 71:                // G
        //     break;
        // case 83:                // S Stop
        //     break;
        case 82:                // R Randomize
            randomize();
            break;
        // case 79:                // O Arpeggiator
        //     toggleLatch();
        //     break;
        // case 76:                // L Latch
        //     toggleLatch();
        //     break;
        case 27:                // ESC Panic
        // case 80:                // P Panic
        //     stopNote(last_note);
        //     // panic();
        //     break;
        case 77:                // M Mono
            break;
        case 80:                // P Poly
            break;
        case 82:                // R ARP
            break;
        case 89:                // Y Dry
            break;
        case 73:                // I Init
            init();
            break;
        case 33:                // Page Up
        case 38:                // Up arrow
        case 39:                // Right arrow
        case 107:               // num keypad "+"
            presetInc();
            break;
        case 34:                // Page Down
        case 40:                // Down arrow
        case 37:                // Left arrow
        case 109:               // num keypad "-"
            presetDec();
            break;
    }
}

function keyUp(code, alt, shift) {
    switch (code) {
        case 27:                // close all opened panel with ESC key:
            closeFavoritesPanel();
            closeSettingsPanel();
            break;
    }
}

/**
 *
 */
function setupMenu() {

    console.log("setupMenu()");

    // $("#menu-favorites").click(openFavoritesPanel);
    $("#menu-randomize").click(randomize);
    $("#menu-init").click(init);
    $("#menu-load-preset").click(loadPresetFromFile);
    // $("#menu-save-preset").click(savePresetToFile);
    // $("#menu-get-url").click(reloadWithPresetUrl);
    // $("#menu-print-preset").click(printPreset);
    // $("#menu-sync").click(syncUIwithDEVICE);
    $("#menu-midi").click(openMidiWindow);
    // $("#menu-settings").click(openSettingsPanel);
    // $("#menu-help").click(openHelpDialog);
    // $("#menu-about").click(openCreditsDialog);

    // in load-preset-dialog:
    $("#preset-file").change(readFile);

    $("#menu-zoom-in").click(zoomIn);
    $("#menu-zoom-out").click(zoomOut);

    // // in settings dialog:
    // $("#midi-channel").change(setMidiChannel);
    // $(".close-settings-panel").click(closeSettingsPanel);
    //
    // // in favorites dialog:
    // $("#add-favorite-bt").click(function(){
    //     addToFavorites();
    //     // closeFavoritesDialog();
    // });
    // $(".close-favorites-panel").click(closeFavoritesPanel);
    //

    //
    // // close all opened panel on outside click:
    // $(document).mousedown(function(e) {
    //     $(".panel").each(function() {
    //         let element = $(this);
    //         if (element.is(":visible")) {
    //             // if the target of the click isn"t the container nor a descendant of the container
    //             if (!element.is(e.target)) {
    //                 if (element.has(e.target).length === 0) {
    //                     element.hide("slide", {direction: "left"}, 500);
    //                 }
    //             }
    //         }
    //     });
    // });

}

//==================================================================================================================
// Settings

var settings = {
    midi_channel: "all",
    randomize: [],
    fade_unused: false
};

function loadSettings() {
    console.log("TODO: loadSettings()");
}

function saveSettings() {
    console.log("TODO: saveSettings()");
}

function setupSettings() {
    console.log("TODO: setupSettings()");
}

function displayRandomizerSettings() {
    console.log("TODO: displayRandomizerSettings()");
}


//==================================================================================================================
// SysEx

/**
 * Send a sysex to the DEVICE asking for it to send back a sysex dump of its current preset.
 * F0 00 20 29 00 33 00 40  F7
 */
function requestSysExDump() {
    // if (midi_output) {
    //     console.log("requestSysExDump()", midi_output);
    //     midi_output.sendSysex(DEVICE.meta.signature.sysex.value, [0x00, 0x33, 0x00, 0x40]);
    // }
}

//==================================================================================================================
// WebMidi events handling

function disconnectInput() {
    if (TRACE) console.log("disconnectInput()");
    if (midi_input) {
        midi_input.removeListener();    // remove all listeners for all channels
        console.log("midi_input not listening");
    }
}

/**
 *
 * @param input
 */
function connectInput(input) {

    if (TRACE) console.log("connectInput()");

    if (!input) return;

    if (TRACE) console.log(`connect input to channel ${midi_channel}`);
    // if (input) {
    midi_input = input;
    // setStatus(`"${midi_input.name}" input connected.`);
    if (TRACE) console.log(`midi_input assigned to "${midi_input.name}"`);
    // }
    midi_input
        .on("programchange", midi_channel, function(e) {        // sent by the DEVICE when changing preset
            handlePC(e);
        })
        .on("controlchange", midi_channel, function(e) {
            handleCC(e);
        })
        .on("sysex", midi_channel, function(e) {
            console.log("sysex handler");
            if (TRACE) console.log("update DEVICE with sysex");
            if (DEVICE.setValuesFromSysEx(e.data)) {
                updateUI();
                // setStatus("UI updated from SysEx.");
                if (TRACE) console.log("DEVICE updated with sysex");
            } else {
                setStatusError("Unable to update from SysEx data.")
            }
        });
    console.log(`${midi_input.name} listening on channel ${midi_channel}`);
    setMidiInStatus(true);
    setStatus(`${midi_input.name} connected on MIDI channel ${midi_channel}.`);
}

/**
 *
 * @param output
 */
function connectOutput(output) {
    if (TRACE) console.log("connect output", output);
    midi_output = output;
    // setStatus(`"${output.name}" output connected.`)
    console.log(`midi_output assigned to "${midi_output.name}"`);
    // setMidiOutStatus(true);
}


function setInputDevice(id) {
    console.log("setInputDevice", id);

    disconnectInput();

    let input = WebMidi.getInputById(id);
    if (input) {
        connectInput(input);
        setStatus(`${input.name} MIDI device found on MIDI channel ${midi_channel}.`);
    } else {
        setStatusError(`MIDI device not found. Please connect your device or check the MIDI channel.`);
        setMidiInStatus(false);
    }
}

function setOutputDevice(id) {
    console.log("setOutputDevice", id);
    let output = WebMidi.getOutputById(id);
    if (output) {
        connectOutput(output);
    } else {
        setStatusError(`MIDI device not found. Please connect your device or check the MIDI channel.`);
        // setMidiOutStatus(false);
    }
}


/**
 *
 * @param info
 */
function deviceConnect(info) {

    console.log("deviceConnect", info);
    // console.log("deviceConnect device names", DEVICE.name_device_in, DEVICE.name_device_out);

    // console.log("deviceConnect port type ***", typeof info.port);
    // console.log("deviceConnect port object ***", info.port);

    updateSelectDeviceList();

    if ((info.port.name !== DEVICE.name_device_in) && (info.port.name !== DEVICE.name_device_out)) {
        // console.log("ignore deviceConnect", info.port.name, DEVICE.name_device_in, DEVICE.name_device_out);
        return;
    }

/*
    if (info.port.type === "input") {
    // if (info.hasOwnProperty("input") && info.input && (info.port.name === DEVICE.name_device_in)) {
        if (!midi_input) {
            connectInput(info.port);
        } else {
            console.log("deviceConnect: input already connected");
        }
    }
    // if (info.hasOwnProperty("output") && info.output && (info.port.name === DEVICE.name_device_out)) {
    if (info.port.type === "output") {
        if (!midi_output) {
            connectOutput(info.port);
            //TODO: we should ask the user
            // ask the DEVICE to send us its current preset:
            requestSysExDump();
        } else {
            console.log("deviceConnect: output already connected");
        }
    }
*/

}

/**
 *
 * @param info
 */
function deviceDisconnect(info) {
    console.log("deviceDisconnect", info);

    updateSelectDeviceList();

/*
    if ((info.port.name !== DEVICE.name_device_in) && (info.port.name !== DEVICE.name_device_out)) {
        console.log(`disconnect event ignored for device ${info.port.name}`);
        return;
    }
    if (info.port.name === DEVICE.name_device_in) {
        midi_input = null;
        setStatus(`${DEVICE.name_device_in} has been disconnected.`);
        setMidiInStatus(false);
    }
    if (info.port.name === DEVICE.name_device_out) {
        midi_output = null;
        // setMidiOutStatus(false);
    }
*/

}

//==================================================================================================================
// Main

/**
 *
 */
$(function () {

    console.log(`Enzo Web Interface ${VERSION}`);

    setupUI();

    // init(false);    // init DEVICE then UI without sending any CC to the DEVICE

    setStatus("Waiting for MIDI interface access...");

    WebMidi.enable(function (err) {

        if (err) {

            console.log("webmidi err", err);

            setStatusError("ERROR: WebMidi could not be enabled.");

            let s = Utils.getParameterByName("sysex");
            if (s) {
                if (TRACE) console.log("sysex param present");
                let data = Utils.fromHexString(s);
                if (DEVICE.setValuesFromSysEx(data)) {
                    if (TRACE) console.log("sysex loaded in device");
                    updateUI();
                } else {
                    console.log("unable to set value from sysex param");
                }
            }

        } else {

            console.log("webmidi ok");

            setStatus("WebMidi enabled.");

            if (TRACE) {
                WebMidi.inputs.map(i => console.log("input: ", i));
                WebMidi.outputs.map(i => console.log("output: ", i));
            }

            WebMidi.addListener("connected", e => deviceConnect(e));
            WebMidi.addListener("disconnected", e => deviceDisconnect(e));

/*
            let input = WebMidi.getInputByName(DEVICE.name_device_in);
            if (input) {
                connectInput(input);
                setStatus(`${DEVICE.name_device_in} MIDI device found on MIDI channel ${midi_channel}.`);
            } else {
                setStatusError(`${DEVICE.name_device_in} MIDI device not found. Please connect your ${DEVICE.name} or check the MIDI channel.`);
                setMidiInStatus(false);
            }

            let output = WebMidi.getOutputByName(DEVICE.name_device_out);
            if (output) {
                connectOutput(output);
            } else {
                setStatusError(`${DEVICE.name_device_out} MIDI device not found. Please connect your ${DEVICE.name} or check the MIDI channel.`);
                // setMidiOutStatus(false);
            }
*/

/*
            let s = Utils.getParameterByName("sysex");
            if (s) {
                if (TRACE) console.log("sysex param present");
                let data = Utils.fromHexString(s);
                if (DEVICE.setValuesFromSysEx(data)) {
                    console.log("sysex loaded in device");
                    updateUI();
                    updateConnectedDevice();
                } else {
                    console.log("unable to set value from sysex param");
                }
            } else {
                //TODO: we should ask the user
                // ask the DEVICE to send us its current preset:
                requestSysExDump();
            }
*/

        }

    }, true);   // pass true to enable sysex support

});
