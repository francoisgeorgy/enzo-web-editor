import DEVICE from "./enzo/enzo.js";
import Knob from "svg-knob";
import store from 'storejs';
import * as Utils from "./lib/utils.js";
import LZString from "lz-string";
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
import {SYNTH_MODES, WAVESHAPES} from "./enzo/constants";

const TRACE = false;    // when true, will log more details in the console
const VERSION = "[AIV]{version}[/AIV]";
const URL_PARAM_SYSEX = "sysex";    // name of sysex parameter in the query-string

let midi_input = null;
let midi_output = null;
// let midi_channel = "all";
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
    if (TRACE) console.info("status:", msg);
    // $("#status").removeClass("error").text(msg);
    $("#info-message").text(msg);
}

function setStatusError(msg) {
    if (TRACE) console.warn("error:", msg);
    // $("#status").addClass("error").text(msg);
    $("#error-message").text(msg);
}

function applyZoom() {
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
// Utilities

/*
let momentary_active = false;

function momentary(callback) {
    if (!momentary_active) {
        momentary_active = true;
        $("#midi-in-led").addClass("on");
        let timeoutID = window.setTimeout(
            function () {
                $("#midi-in-led").removeClass("on");
                momentary_active = false;
                timeoutID = null;
            },
            500);
    }
}
*/

//==================================================================================================================
// Midi messages handling

let activity_in = false;

function showMidiInActivity() {
    if (!activity_in) {
        activity_in = true;
        $("#midi-in-led").addClass("on");
        let timeoutID = window.setTimeout(
            function () {
                $("#midi-in-led").removeClass("on");
                activity_in = false;
                timeoutID = null;
            },
            500);
    }
}

let activity_out = false;

function showMidiOutActivity() {
    if (!activity_out) {
        activity_out = true;
        $("#midi-out-led").addClass("on");
        let timeoutID = window.setTimeout(
            function () {
                $("#midi-out-led").removeClass("on");
                activity_out = false;
                timeoutID = null;
            },
            500);
    }
}

let preset_number = 0;

function sendPC(pc) {
    preset_number = pc;
    if (midi_output) {
        if (TRACE) console.log(`send program change ${preset_number}`);
        showMidiOutActivity();
        midi_output.sendProgramChange(preset_number, settings.midi_channel);
    }
    logOutgoingMidiMessage("PC", preset_number);
}

function displayPreset() {
    $(".preset-id").removeClass("on");
    $(`#pc-${preset_number}`).addClass("on");
}

function presetInc() {
    if (TRACE) console.log("presetInc");
    sendPC((preset_number % 16) + 1);
    displayPreset();
}

function presetDec() {
    if (TRACE) console.log("presetDec");
    preset_number--;
    if (preset_number < 1) preset_number = 16;
    sendPC(preset_number);
    displayPreset();
}

/**
 * Handle Program Change messages
 * @param e
 */
function handlePC(e) {

    if (TRACE) console.log("receive PC", e);

    if (e.type !== "programchange") return;

    showMidiInActivity();

    logIncomingMidiMessage("PC", 0, e.value);

    preset_number = e.value;
}

/**
 * Handle all control change messages received
 * @param e
 */
function handleCC(e) {

    const msg = e.data;
    const cc = msg[1];
    const v = msg[2];

    if (TRACE) console.log("receive CC", cc, v);

    showMidiInActivity();

    logIncomingMidiMessage("CC", cc, v);

    if (DEVICE.control[cc]) {
        dispatch("cc", cc, v);
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
    if (!e.is(".on")) {   // if not already on...
        e.siblings(".bt").removeClass("on");
        e.addClass("on");
    }
}

function updateMomentaryStompswitch(id, value) {
    if (value === 0) {
        $(`#${id}-off`).removeClass("sw-off");
        $(`#${id}-on`).addClass("sw-off");
    } else {
        $(`#${id}-off`).addClass("sw-off");
        $(`#${id}-on`).removeClass("sw-off");
    }
}

/**
 *
 * @param control_type
 * @param control_number
 * @param value
 * @param mappedValue
 */
function updateControl(control_type, control_number, value, mappedValue) {

    if (TRACE) console.log(`updateControl(${control_type}, ${control_number}, ${value})`);

    if (mappedValue === undefined) {
        mappedValue = value;
    }

    const id = control_type + "-" + control_number;
    if (knobs.hasOwnProperty(id)) {
        knobs[id].value = value;
    } else {

        if (control_type === "cc" && control_number == 14) {
            updateBypassSwitch(value);
            return;
        }

        let c = $(`#${id}`);

        if (c.length) { // jQuery trick to check if element was found
            console.warn("updateControl: unsupported control (1): ", control_type, control_number, value);
        } else {
            c = $(`#${id}-${mappedValue}`);
            if (c.length) {
                if (c.is(".bt")) {
                    updateOptionSwitch(id + "-" + mappedValue, mappedValue);
                } else if (c.is(".sw")) {
                    //TODO: handle .sw controls
                } else if (c.is(".swm")) {
                    updateMomentaryStompswitch(`${id}-${mappedValue}`, mappedValue);
                    setTimeout(() => updateMomentaryStompswitch(`${id}-${mappedValue}`, 0), 200);
                } else {
                    console.warn("updateControl: unsupported control (2): ", control_type, control_number, value);
                }
            } else {
                console.warn(`no control for ${id}-${mappedValue}`);
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
            if (TRACE) console.log(`send CC ${a[i][0]} ${a[i][1]} (${control.name}) on MIDI channel ${settings.midi_channel}`);
            showMidiOutActivity();
            midi_output.sendControlChange(a[i][0], a[i][1], settings.midi_channel);
        } else {
            if (TRACE) console.log(`(send CC ${a[i][0]} ${a[i][1]} (${control.name}) on MIDI channel ${settings.midi_channel})`);
        }
        logOutgoingMidiMessage("CC", a[i][0], a[i][1]);
    }
}

/**
 * Send all values to the connected device
 */
function updateConnectedDevice(onlyChanged = false) {
    console.log("TODO: updateConnectedDevice()");
    const c = DEVICE.control;
    for (let i=0; i < c.length; i++) {
        if (typeof c[i] === "undefined") continue;
        if (!onlyChanged || c[i].randomized) {
            sendCC(c[i]);
            c[i].randomized = false;
        }
    }
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

function init(sendUpdate = true) {
    if (TRACE) console.log(`init(${sendUpdate})`);
    DEVICE.init();
    updateUI(true);
    if (sendUpdate) {
        updateConnectedDevice();
    }
    return false;   // disable the normal href behavior
}

function randomize() {
    if (TRACE) console.log("randomize");
    DEVICE.randomize();
    updateUI();
    updateConnectedDevice(true);    // true == update only updated values (values which have been marked as changed)
    return false;   // disable the normal href behavior
}

function tapDown(id) {
    updateMomentaryStompswitch(id, 127);
    handleUserAction(...id.split("-"));
}

function tapRelease(id) {
    updateMomentaryStompswitch(id, 0);
}

//==================================================================================================================

/**
 * Set value of the controls (input and select) from the DEVICE values
 */
function updateControls() {
    console.log("updateControls()");

    for (let i=0; i < DEVICE.control.length; i++) {
        if (typeof DEVICE.control[i] === "undefined") continue;
        updateControl(DEVICE.control[i].cc_type, i, DEVICE.getControlValue(DEVICE.control[i]), DEVICE.getMappedControlValue(DEVICE.control[i]));
    }

} // updateControls()

/**
 *
 */
function setupKnobs() {

    if (TRACE) console.log("setupKnobs()");

    for (let i=0; i < DEVICE.control.length; i++) {

        const c = DEVICE.control[i];
        if (typeof c === "undefined") {
            if (TRACE) console.log("device undefined", i);
            continue;
        }

        const id = `${c.cc_type}-${c.cc_number}`;
        const v = DEVICE.getControlValue(DEVICE.control[i]);

        let elem = document.getElementById(id);
        if (elem === null) {
            // console.warn(`setupKnobs: element not found for id ${id}`);
            continue;
        }
        if (!elem.classList.contains("knob")) return;

        if (TRACE) console.log(`configure #${id}: range=${c.cc_range}, init-value=${v}`);

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

    if (TRACE) console.log("setupPresetSelectors()");

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

    if (TRACE) console.log("setupSwitches()");

    // "radio button"-like behavior:
    $("div.bt").click(function() {
        if (TRACE) console.log(`click on ${this.id}`);
        if (!this.classList.contains("on")) {   // if not already on...
            $(this).siblings(".bt").removeClass("on");
            this.classList.add("on");
            handleUserAction(...this.id.split("-"));
        }
    });

    // toggle stompswitches:
    $(".sw").click(function() {
        this.classList.add("sw-off");
        $(this).siblings(".sw").removeClass("sw-off");
        handleUserAction(...this.id.split("-"));
    });

    // momentary stompswitches:
    $(".swm").mousedown(function() { tapDown(this.id) }).mouseup(function() { tapRelease(this.id) });

}

function setupSelects() {
    $("#zoom-0ize").change((event) => setLayoutSize(event.target.value));
    $("#midi-channel").change((event) => setMidiChannel(event.target.value));
    $("#midi-channel").val(settings.midi_channel);
    $("#midi-input-device").change((event) => setInputDevice(event.target.value));
    $("#midi-output-device").change((event) => setOutputDevice(event.target.value));
}

function updateSelectDeviceList() {

    if (TRACE) console.log("updateSelectDeviceList", settings.input_device_id, settings.output_device_id);

    let present = false;
    let s = $("#midi-input-device");
    s.empty().append($("<option>").val("").text("- select -"));
    s.append(
        WebMidi.inputs.map((port, index) => {
            present = port.id === settings.input_device_id;
            return $("<option>").val(port.id).text(`${port.name}`);
        })
    );
    s.val(present ? settings.input_device_id : "");

    present = false;
    s = $("#midi-output-device");
    s.empty().append($("<option>").val("").text("- select -"));
    s.append(
        WebMidi.outputs.map((port, index) => {
            present = port.id === settings.output_device_id;
            return $("<option>").val(port.id).text(`${port.name}`);
        })
    );
    s.val(present ? settings.output_device_id : "");
}

/**
 * Update the patch number and patch name displayed in the header.
 */
function updateMeta() {
    if (DEVICE.meta.preset_id.value) {
        preset_number = DEVICE.meta.preset_id.value;
        displayPreset();
    }
}

/**
 * Update the UI from the DEVICE controls values.
 */
function updateUI() {
    updateMeta();
    updateControls();
    if (TRACE) console.log("updateUI done");
}

/**
 * Initial setup of the UI.
 * Does a DEVICE.init() too, but only the virtual DEVICE; does not send any CC to the connected device.
 */
function setupUI() {

    if (TRACE) console.groupCollapsed("setupUI");

    $("span.version").text(VERSION);

    setMidiInStatus(false);
    // setMidiOutStatus(false);

    setupKnobs();
    setupPresetSelectors();
    setupSwitches();
    setupMenu();
    setupSelects();

    setupKeyboard();

    if (TRACE) console.groupEnd();
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
/*
function syncUIwithDEVICE() {
    // ask the DEVICE to send us its current preset:
    // requestSysExDump();
    return false;   // disable the normal href behavior
}
*/

/**
 * header"s "midi channel" select handler
 */
function setMidiChannel(channel) {
    if (TRACE) console.log("setMidiChannel", channel);
    disconnectInput();
    settings.midi_channel = channel;
    saveSettings();
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
    if (TRACE) console.log(`setLayoutSize(${size})`);
    $("#main").removeClass("zoom-0 zoom-1 zoom-2").addClass(size);
}


function updateBypassSwitch(value) {
    if (TRACE) console.log("updateBypassSwitch", value);
    if (value === 0) {
        $("#cc-14-0").addClass("sw-off");
        $("#cc-14-127").removeClass("sw-off");
    } else {
        $("#cc-14-127").addClass("sw-off");
        $("#cc-14-0").removeClass("sw-off");
    }
}

function toggleBypass() {
    const c = DEVICE.control[DEVICE.control_id.bypass];
    const v = DEVICE.getControlValue(c) === 0 ? 127 : 0;
    updateDevice(c.cc_type, c.cc_number, v);
    updateBypassSwitch(v);
}

function selectSquareware() {
    const c = DEVICE.control[DEVICE.control_id.synth_waveshape];
    updateDevice(c.cc_type, c.cc_number, WAVESHAPES.sawtooth);
    updateControl(c.cc_type, c.cc_number, WAVESHAPES.sawtooth);
}

function selectSawtooth() {
    const c = DEVICE.control[DEVICE.control_id.synth_waveshape];
    updateDevice(c.cc_type, c.cc_number, WAVESHAPES.square);
    updateControl(c.cc_type, c.cc_number, WAVESHAPES.square);
}

function selectDry() {
    const c = DEVICE.control[DEVICE.control_id.synth_mode];
    updateDevice(c.cc_type, c.cc_number, SYNTH_MODES.dry);
    updateControl(c.cc_type, c.cc_number, SYNTH_MODES.dry);
}

function selectMono() {
    const c = DEVICE.control[DEVICE.control_id.synth_mode];
    updateDevice(c.cc_type, c.cc_number, SYNTH_MODES.mono);
    updateControl(c.cc_type, c.cc_number, SYNTH_MODES.mono);
}

function selectPoly() {
    const c = DEVICE.control[DEVICE.control_id.synth_mode];
    updateDevice(c.cc_type, c.cc_number, SYNTH_MODES.poly);
    updateControl(c.cc_type, c.cc_number, SYNTH_MODES.poly);
}

function selectArp() {
    const c = DEVICE.control[DEVICE.control_id.synth_mode];
    updateDevice(c.cc_type, c.cc_number, SYNTH_MODES.arp);
    updateControl(c.cc_type, c.cc_number, SYNTH_MODES.arp);
}


let animations = {};     // one entry possible per CC; entry is {timeout_handler, target_value}

function _animateCC(control_number, n, callback) {

    if (n === animations[control_number].to) {
        clearTimeout(animations[control_number].handler);
        animations[control_number] = null;
        return;
    }

    n < animations[control_number].to ? n++ : n--;

    callback(n);

    animations[control_number].handler = setTimeout(() => _animateCC(control_number, n, callback), 1000/60);
}

function _stopAnimateCC(control_number) {
    clearTimeout(animations[control_number].handler);
    animations[control_number] = null;
}

function animateCC(control_number, from, to) {
    if (TRACE) console.log(`animateCC(${control_number}, ${from}, ${to})`);
    if (animations[control_number]) {
        if (animations[control_number].to === to) {
            _stopAnimateCC(control_number);
        } else {
            animations[control_number].to = to;     // change direction
        }
    } else {
        animations[control_number] = {
            handler: null,
            to: to
        };
        _animateCC(control_number, from, function (v) {
            dispatch("cc", control_number, v);
            updateDevice("cc", control_number, v);
        });
    }
}

/*
function animateCC(control_number, from, to) {
    let p = 0;
    $({ n: from }).animate({ n: to}, {
        duration: 2000,
        step: function(now) {
            // console.log(now);
            const i = Math.round(now);
            if (p !== i) {
                p = i;
                const v = Math.round(now);
                // console.log(p);
                dispatch("cc", control_number, v);
                updateDevice("cc", control_number, v);
            }
        }
    });
}
*/

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

    // if ((code >= 65) && (code <= 70)) {   // A..F
    //     preset_number = code - 65 + 10 + 1;
    //     displayPreset();
    //     return;
    // }

    switch (code) {
        // case 35:                // End
        //     animateControl();
        //     break;
        case 67:                // C
            animateCC(DEVICE.control_id.pitch, DEVICE.getControlValue(DEVICE.getControl(DEVICE.control_id.pitch)), shift ? 63 : 0);
            break;
        case 86:                // V
            animateCC(DEVICE.control_id.pitch, DEVICE.getControlValue(DEVICE.getControl(DEVICE.control_id.pitch)), shift ? 63 : 127);
            break;
        case 70:                // F
            animateCC(DEVICE.control_id.filter, DEVICE.getControlValue(DEVICE.getControl(DEVICE.control_id.filter)), shift ? 63 : 0);
            break;
        case 71:                // G
            animateCC(DEVICE.control_id.filter, DEVICE.getControlValue(DEVICE.getControl(DEVICE.control_id.filter)), shift ? 63 : 127);
            break;
        case 72:                // H
            animateCC(DEVICE.control_id.filter_bandwidth, DEVICE.getControlValue(DEVICE.getControl(DEVICE.control_id.filter_bandwidth)), shift ? 63 : 0);
            break;
        case 74:                // J
            animateCC(DEVICE.control_id.filter_bandwidth, DEVICE.getControlValue(DEVICE.getControl(DEVICE.control_id.filter_bandwidth)), shift ? 63 : 127);
            break;
        case 75:                // K    delay level
            animateCC(DEVICE.control_id.delay_level, DEVICE.getControlValue(DEVICE.getControl(DEVICE.control_id.delay_level)), shift ? 63 : 0);
            break;
        case 76:                // L    delay level
            animateCC(DEVICE.control_id.delay_level, DEVICE.getControlValue(DEVICE.getControl(DEVICE.control_id.delay_level)), shift ? 63 : 127);
            break;
        case 89:                // Y    min mix
            animateCC(DEVICE.control_id.mix, DEVICE.getControlValue(DEVICE.getControl(DEVICE.control_id.mix)), shift ? 63 : 0);
            break;
        case 88:                // X    max mix
            animateCC(DEVICE.control_id.mix, DEVICE.getControlValue(DEVICE.getControl(DEVICE.control_id.mix)), shift ? 63 : 127);
            break;
        case 66:                // B    min sustain
            // const v = DEVICE.getControlValue(DEVICE.getControl(DEVICE.control_id.sustain));
            animateCC(DEVICE.control_id.sustain, DEVICE.getControlValue(DEVICE.getControl(DEVICE.control_id.sustain)), shift ? 63 : 0);
            break;
        case 78:                // N    max sustain
            // const v = DEVICE.getControlValue(DEVICE.getControl(DEVICE.control_id.sustain));
            animateCC(DEVICE.control_id.sustain, DEVICE.getControlValue(DEVICE.getControl(DEVICE.control_id.sustain)), shift ? 63 : 127);
            break;
        case 84:                // T            tap
            tapDown("cc-28-shift ? 63 : 127");
            break;
        case 90:                // Z
            animateCC(DEVICE.control_id.ring_modulation, DEVICE.getControlValue(DEVICE.getControl(DEVICE.control_id.ring_modulation)), shift ? 63 : 0);
            break;
        case 85:                // U
            animateCC(DEVICE.control_id.ring_modulation, DEVICE.getControlValue(DEVICE.getControl(DEVICE.control_id.ring_modulation)), shift ? 63 : 127);
            break;
        case 32:                // SPACE
            toggleBypass();
            break;
        case 109:               // num keypad "-"
            animateCC(DEVICE.control_id.modulation, DEVICE.getControlValue(DEVICE.getControl(DEVICE.control_id.modulation)), shift ? 63 : 0);
            break;
        case 107:               // num keypad "+"
            animateCC(DEVICE.control_id.modulation, DEVICE.getControlValue(DEVICE.getControl(DEVICE.control_id.modulation)), shift ? 63 : 127);
            break;
        case 79:                   // O
            const v = DEVICE.getControlValue(DEVICE.getControl(DEVICE.control_id.portamento));
            animateCC(DEVICE.control_id.portamento, v, shift ? 63 : (v < 63 ? 127 : 0));
            break;
        // case 66:                // B
        // case 67:                // C
        // case 68:                // D
        // case 69:                // E
        // case 70:                // F
        // case 71:                // G
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
        // case 27:                // ESC Panic
        // case 80:                // P Panic
        //     stopNote(last_note);
        //     // panic();
        //     break;
        case 77:                // M Mono
            selectMono();
            break;
        case 80:                // P Poly
            selectPoly();
            break;
        case 65:                // A ARP
            selectArp();
            break;
        case 68:                // D Dry
            selectDry();
            break;
        case 73:                // I Init
            init();
            break;
        case 81:                // Q Squarewave
            selectSquareware();
            break;
        case 87:                // W Sawtooth wave
            selectSawtooth();
            break;
        case 38:                // Up arrow
        case 39:                // Right arrow
            presetInc();
            break;
        case 40:                // Down arrow
        case 37:                // Left arrow
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
        case 84:                // T            tap
            tapRelease("cc-28-127");
            break;
    }
}

/**
 *
 */
function setupMenu() {

    if (TRACE) console.log("setupMenu()");

    // $("#menu-favorites").click(openFavoritesPanel);
    $("#menu-randomize").click(randomize);
    $("#menu-init").click(init);
    $("#menu-load-preset").click(loadPresetFromFile);
    // $("#menu-save-preset").click(savePresetToFile);
    // $("#menu-get-url").click(reloadWithPresetUrl);
    $("#menu-print-preset").click(printPreset);
    // $("#menu-sync").click(syncUIwithDEVICE);
    $("#menu-midi").click(openMidiWindow);
    // $("#menu-settings").click(openSettingsPanel);
    $("#menu-help").click(openHelpDialog);
    $("#menu-about").click(openCreditsDialog);

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

let settings = {
    midi_channel: "all",
    input_device_id: null,    // web midi port ID
    output_device_id: null    // web midi port ID
};

function loadSettings() {
    const s = store.get("enzo.settings");
    if (s) settings = JSON.parse(s);
    // settings.input_device_id = store.get("enzo.settings.input_device_id");
    // settings.output_device_id = store.get("enzo.settings.output_device_id");
}

function saveSettings() {
    store("enzo.settings", JSON.stringify(settings));
    // store("enzo.settings.input_device_id", settings.input_device_id);
    // store("enzo.settings.output_device_id", settings.output_device_id);
}

//==================================================================================================================
// WebMidi events handling

function disconnectInput() {
    if (TRACE) console.log("disconnectInput()");
    if (midi_input) {
        midi_input.removeListener();    // remove all listeners for all channels
        midi_input = null;
        if (TRACE) console.log("midi_input not listening");
    }
}

/**
 *
 * @param input
 */
function connectInput(input) {

    if (TRACE) console.log("connectInput()");

    if (!input) return;

    if (TRACE) console.log(`connect input to channel ${settings.midi_channel}`);
    // if (input) {
    midi_input = input;
    // setStatus(`"${midi_input.name}" input connected.`);
    if (TRACE) console.log(`midi_input assigned to "${midi_input.name}"`);
    // }
    midi_input
        .on("programchange", settings.midi_channel, function(e) {        // sent by the DEVICE when changing preset
            handlePC(e);
        })
        .on("controlchange", settings.midi_channel, function(e) {
            handleCC(e);
        })
        .on("sysex", settings.midi_channel, function(e) {
            // console.log("sysex handler");
            if (TRACE) console.log("update DEVICE with sysex");
            if (DEVICE.setValuesFromSysEx(e.data)) {
                updateUI();
                setStatus("SysEx received.");
                if (TRACE) console.log("DEVICE updated with sysex");
            } else {
                setStatusError("Unable to update from SysEx data.")
            }
        });
    if (TRACE) console.log(`${midi_input.name} listening on channel ${settings.midi_channel}`);
    setMidiInStatus(true);
    setStatus(`${midi_input.name} connected on MIDI channel ${settings.midi_channel}.`);
}

function disconnectOutput() {
    midi_output = null;
}

/**
 *
 * @param output
 */
function connectOutput(output) {
    if (TRACE) console.log("connect output");
    midi_output = output;
    if (TRACE) console.log(`midi_output assigned to "${midi_output.name}"`);
    // setMidiOutStatus(true);
}

function setInputDevice(id) {

    // if (!id) return;

    if (TRACE) console.log(`setInputDevice(${id})`);

    // save in settings for autoloading at next restart:
    settings.input_device_id = id;
    saveSettings();

    disconnectInput();

    let input = WebMidi.getInputById(id);
    if (input) {
        connectInput(input);
    } else {
        setStatusError(`MIDI device not found. Please connect your device or check the MIDI channel.`);
        setMidiInStatus(false);
    }
}

function setOutputDevice(id) {

    // if (!id) return;

    if (TRACE) console.log(`setOutputDevice(${id})`, settings);

    // save in settings for autoloading at next restart:
    settings.output_device_id = id;
    saveSettings();

    disconnectOutput();

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
    if (TRACE) console.log("deviceConnect", info);
    // updateSelectDeviceList();
    if (settings) {
        setInputDevice(settings.input_device_id);
        setOutputDevice(settings.output_device_id);
        updateSelectDeviceList();
    }
}

/**
 *
 * @param info
 */
function deviceDisconnect(info) {
    if (TRACE) console.log("deviceDisconnect", info);
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

    if (TRACE) console.log(`Enzo Web Interface ${VERSION}`);

    loadSettings();

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

            if (TRACE) console.log("webmidi ok");

            setStatus("WebMidi enabled.");

            if (TRACE) {
                WebMidi.inputs.map(i => console.log("available input: ", i));
                WebMidi.outputs.map(i => console.log("available output: ", i));
            }

            WebMidi.addListener("connected", e => deviceConnect(e));
            WebMidi.addListener("disconnected", e => deviceDisconnect(e));

            if (settings) {
                setInputDevice(settings.input_device_id);
                setOutputDevice(settings.output_device_id);
                updateSelectDeviceList();
            }

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
