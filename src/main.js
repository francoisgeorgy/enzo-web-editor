import DEVICE from "./enzo/enzo.js";
import Knob from "svg-knob";
// import * as Utils from "./lib/utils.js";
import * as WebMidi from "webmidi";
// CSS order is important
import "./css/lity.min.css";
import "./css/main.css";
import {detect} from "detect-browser";

const TRACE = true;    // when true, will log more details in the console

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
        $("#neon").addClass("glow");
    } else {
        $("#neon").removeClass("glow");
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
        midi_in_messages++;
        // log at max 1000 messages:
        if (midi_in_messages > 1000) $("#midi-messages-in div:last-child", midi_window.document).remove();
        let s = type + " " +
            control.toString(10).padStart(3, "0") + " " +
            value.toString(10).padStart(3, "0") + " (" +
            control.toString(16).padStart(2, "0") + " " +
            value.toString(16).padStart(2, "0") + ")";
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
        midi_out_messages++;
        // log at max 1000 messages:
        if (midi_out_messages > 1000) $("#midi-messages-out div:last-child", midi_window.document).remove();
        let s = type + " " +
            control.toString(10).padStart(3, "0") + " " +
            value.toString(10).padStart(3, "0") + " (" +
            control.toString(16).padStart(2, "0") + " " +
            value.toString(16).padStart(2, "0") + ")";
        $("#midi-messages-out", midi_window.document).prepend(`<div>${s.toUpperCase()}</div>`);
    }
}

//==================================================================================================================

/**
 * Get a link for the current patch
 *
 */
/*
function getCurrentPatchAsLink() {
    // window.location.href.split("?")[0] is the current URL without the query-string if any
    return window.location.href.replace("#", "").split("?")[0] + "?" + URL_PARAM_SYSEX + "=" + Utils.toHexString(DEVICE.getSysEx());
}
*/

//==================================================================================================================
// Midi messages handling

let patch_number = -1;
let patch_name = null;

// function displayPatchName() {
//     //TODO: get value from BS2
//     $("#patch-name").text(patch_name);
// }
//
// function displayPatchNumber() {
//     //TODO: get value from BS2
//     $("#patch-number").html(patch_number);
// }

function sendPatchNumber() {
    if (midi_output) {
        if (TRACE) console.log(`send program change ${patch_number}`);
        midi_output.sendProgramChange(patch_number, midi_channel);
    }
}

/**
 * Handle Program Change messages
 * @param e
 */
function handlePC(e) {

    if (TRACE) console.log("receive PC", e);

    if (e.type !== "programchange") return;

    logIncomingMidiMessage("PC", 0, e.value);

    //TODO: update value in BS2 object

    patch_number = e.value;
    displayPatchNumber();
    requestSysExDump();
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

    // update the customs UI elements. Any input|select element has already been updated by the above instruction.
    updateLinkedUIElements(/!*false*!/);   //TODO: pass the current CC number and in updateCustoms() only update controls linked to this CC number

    return control;
}

/**
 *
 * @param control_type
 * @param control_number
 * @param value
 */
function updateControl(control_type, control_number, value) {

    if (TRACE) console.log(`updateControl(${control_type}, ${control_number}, ${value})`);

    let id = control_type + "-" + control_number;
    if (knobs.hasOwnProperty(id)) {
        knobs[id].value = value;
    } else {
        // if (TRACE) console.log(`check #${id}`);

        let c = $(`#${id}`);

        c.val(value).trigger("blur");

/*
        if (c.length) {
            if (c.is(".svg-slider,.svg-slider-env")) {
                updateSVGSlider(id, value);
            } else if (c.is(".slider")) {
                updateSlider(id, value);
            } else if (c.is(".btc")) {
                updateToggleSwitch(id, value);
            } else {
                c.val(value).trigger("blur");
            }

        } else {
            c = $(`#${id}-${value}`);
            if (c.length) {
                if (TRACE) console.log(c);
                if (c.is(".bt")) {
                    updateOptionSwitch(id + "-" + value, value);
                } else {
                    c.val(value).trigger("blur");
                }
            } else {
                console.warn(`no control for ${id}-${value}`);
            }
        }
*/

    }
        // let c = $(`#combo-${id}`);  //TODO: try to do it only if fade_unused has changed
        // if (TRACE) console.log(`reset opacity for #combo-${id}`);

}

//==================================================================================================================
// Updating to the connected device

/**
 * Send a control value to the connected device.
 * @param control
 */
function sendSingleValue(control) {
}

/**
 * Send all values to the connected device
 */
function updateConnectedDevice(onlyChanged = false) {
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
}

/**
 * Handles (reacts to) a change made by the user in the UI.
 */
function handleUIChange(control_type, control_number, value) {
}

//==================================================================================================================

/**
 *
 */
function init(sendUpdate = true) {
/*
    if (TRACE) console.log(`init(${sendUpdate})`);
    DEVICE.init();
    updateUI(true);
    // setStatus(`init done`);
    if (sendUpdate) updateConnectedDevice();
    if (TRACE) console.log(`init done`);
    return false;   // disable the normal href behavior
*/
}

/**
 *
 */
function randomize() {
}

//==================================================================================================================

/**
 * Set value of the controls (input and select) from the BS2 values
 */
function updateControls() {
} // updateControls()

/**
 *
 */
function setupKnobs() {

    function _setupKnob(id, c, v) {

        let elem = document.getElementById(id);

        if (TRACE) console.log(`_setupKnob ${id}`, elem);

        if (elem === null) return;

        if (!elem.classList.contains("knob")) return;

        if (TRACE) console.log(`configure #${id}: range=${c.cc_range}, init-value=${v}`);

        knobs[id] = new Knob(elem, {
            // with_label: false,
            label: false,
            value_min: Math.min(...c.cc_range),
            value_max: Math.max(...c.cc_range),
            value_resolution: 1,
            default_value: v,
            center_zero: Math.min(...c.range) < 0,
            center_value: c.hasOwnProperty("cc_center") ? c.cc_center : c.init_value,
            format: v => c.human(v),
            snap_to_steps: false,
            mouse_wheel_acceleration: 1,
            // background disk:
            bg_radius: 32,
            bg_border_width: 2,
            // track background:
            track_bg_radius: 40,
            track_bg_width: 8,
            // track:
            track_radius: 40,
            track_width: 8,
            // cursor
            cursor_radius: 20,
            cursor_length: 10,
            cursor_width: 4,
            // appearance:
            palette: "dark",
            bg:  true,
            track_bg: true,
            track: true,
            cursor: true,
            linecap: "round",
            value_text: true,
            value_position: 58,    // empirical value: HALF_HEIGHT + config.font_size / 3
            font_family: "sans-serif",
            font_size: 25,
            font_weight: "bold",
            markers: false,
            class_bg: "knob-bg",
            class_track_bg : "knob-track-bg",
            class_track : "knob-track",
            class_value : "knob-value",
            class_cursor : "knob-cursor",
            class_markers: "knob-markers",
            // bg_color: "#333",
            // bg_border_color: "#888",
            // track_bg_color: "#555",
            track_color_init: "#999",
            track_color: "#bbb",
            cursor_color_init: "#bbb",
            cursor_color: "#ddd",
            markers_color: "#3680A4",
            font_color: "#FFEA00"
            // bg_color: "#333",
            // bg_border_color: "#888",
            // track_bg_color: "#555",
            // track_color_init: "#999",
            // track_color: "#bbb",
            // cursor_color_init: "#999",
            // cursor_color: "#bbb",
            // markers_color: "#3680A4",
            // font_color: "#FFEA00"
        });

        knobs[id].disableDebug();

        elem.addEventListener("change", function(event) {
            handleUIChange(c.cc_type, c.cc_number, event.detail);
        });

    }

    for (let i=0; i < DEVICE.control.length; i++) {

        const c = DEVICE.control[i];
        if (typeof c === "undefined") continue;

        // if (TRACE) console.log(`${c.cc_type}-${c.cc_number} (${i})`);

        const id = `${c.cc_type}-${c.cc_number}`;
        _setupKnob(id, c, DEVICE.getControlValue(DEVICE.control[i]));
    }

} // setupKnobs

/**
 * Add double-click handlers on .knob-label elements. A double-click will reset the linked knob.
 */
function setupResets() {
/*
    $(".knob-label:not(.no-reset)")
        .attr("alt", "Double-click to reset")
        .attr("title", "Double-click to reset")
        .dblclick(function() {
            let knob = $(this).siblings(".knob");
            if (knob.length < 1) {
                if (TRACE) console.log("setupResets: no sibbling knob found");
                return;
            }
            if (TRACE) console.log("setupResets knob", knob);
            let [control_type, control_number] = knob[0].id.split("-");
            if (TRACE) console.log(`setupResets ${control_type} ${control_number}`);
            let c;
            if (control_type === "cc") {
                c = DEVICE.control[control_number];
            } else if (control_type === "nrpn") {
                c = DEVICE.nrpn[control_number];
            } else {
                // ERROR
                console.error(`setupResets invalid control id: ${control_type} ${control_number}`);
                return;
            }
            c.raw_value = c.init_value;
            updateControl(control_type, control_number, c.init_value);

            updateDevice(control_type, control_number, c.init_value);

        });
*/
}

/**
 *
 */
function setupSwitches() {
}

/**
 *
 */
function setupSelects() {
} // setupSelects


/**
 * Update the "custom" or "linked" UI elements, like the ADSR curves
 */
function updateLinkedUIElements() {
}

/**
 * Update the patch number and patch name displayed in the header.
 */
function updateMeta(force = false) {
}

/**
 * Update the UI from the DEVICE controls values.
 */
function updateUI(force = false) {
    updateControls();
    updateLinkedUIElements();
    updateMeta(force);
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
    setupResets();
    setupSwitches();
    setupSelects();
    setupMenu();

    console.groupEnd();
}

//==================================================================================================================
// Favorites dialog

let default_favorite_name = "";

function getFavorites() {
}

/**
 *
 * @param index
 */
function deleteFavorite(index) {
}

/**
 *
 */
function refreshFavoritesList() {
}

/**
 * Add the current preset to the list of favorites preset in the local storage
 */
function addToFavorites() {
    return false;   // disable the normal href behavior
}

/**
 *
 */
function openFavoritesPanel() {
    return false;   // disable the normal href behavior
}

/**
 *
 */
function closeFavoritesPanel() {
}


function reloadWithPatchUrl() {
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
// Patch file handling

var lightbox = null;    // lity dialog

/**
 *
 */
function loadPatchFromFile() {
    // $("#load-patch-error").empty();
    // $("#patch-file").val("");
    // lightbox = lity("#load-patch-dialog");
    return false;   // disable the normal href behavior
}

/**
 *
 */
function savePatchToFile() {
    return false;   // disable the normal href behavior
}

/**
 * Handler for the #patch-file file input element in #load-patch
 */
function readFile() {
/*

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
                if (TRACE) console.log("file read OK", DEVICE.meta.patch_name["value"]);
                if (lightbox) lightbox.close();

                updateUI();
                updateConnectedDevice();

            } else {
                console.log("unable to set value from file");
                $("#load-patch-error").show().text("The file is invalid.");
            }
        };
        reader.readAsArrayBuffer(f);
    }
*/
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

function printPatch() {
    if (TRACE) console.log("printPatch");
    let url = "print.html?" + URL_PARAM_SYSEX + "=" + encodeURIComponent(LZString.compressToBase64(Utils.toHexString(DEVICE.getSysEx())));
    window.open(url, "_blank", "width=800,height=600,location,resizable,scrollbars,status");
    return false;   // disable the normal href behavior
}

/**
 * header"s "sync" button handler
 */
function syncUIwithBS2() {
    // ask the BS2 to send us its current patch:
    // requestSysExDump();
    return false;   // disable the normal href behavior
}

/**
 * header"s "midi channel" select handler
 */
function setMidiChannel() {
    disconnectInput();
    midi_channel = this.value;
    connectInput();
}

/**
 *
 * @returns {boolean}
 */
function openMidiWindow() {
    midi_window = window.open("midi.html", "_midi", "location=no,height=480,width=350,scrollbars=yes,status=no");
    return false;   // disable the normal href behavior
}

function patchInc() {
    // if (TRACE) console.log("patchInc");
    // patch_number = (patch_number + 1) % 128;
    // displayPatchNumber();
    // sendPatchNumber();
    // requestSysExDump();
}

function patchDec() {
    // if (TRACE) console.log("patchDec");
    // if (patch_number === -1) patch_number = 1;
    // patch_number--;
    // if (patch_number < 0) patch_number = 127;
    // displayPatchNumber();
    // sendPatchNumber();
    // requestSysExDump();
}

/**
 * https://codepen.io/fgeorgy/pen/NyRgxV?editors=1010
 */
function setupKeyboard() {
}

function keyDown(code, alt, shift) {
}

function keyUp(code, alt, shift) {
}

/**
 *
 */
function setupMenu() {

/*
    $("#menu-favorites").click(openFavoritesPanel);
    $("#menu-randomize").click(randomize);
    $("#menu-init").click(init);
    $("#menu-load-patch").click(loadPatchFromFile);
    $("#menu-save-patch").click(savePatchToFile);
    $("#menu-get-url").click(reloadWithPatchUrl);
    $("#menu-print-patch").click(printPatch);
    $("#menu-sync").click(syncUIwithBS2);
    $("#menu-midi").click(openMidiWindow);
    $("#menu-settings").click(openSettingsPanel);
    $("#menu-help").click(openHelpDialog);
    $("#menu-about").click(openCreditsDialog);

    $("#played-note").click(playLastNote);

    // in load-patch-dialog:
    $("#patch-file").change(readFile);

    // in settings dialog:
    $("#midi-channel").change(setMidiChannel);
    $(".close-settings-panel").click(closeSettingsPanel);

    // in favorites dialog:
    $("#add-favorite-bt").click(function(){
        addToFavorites();
        // closeFavoritesDialog();
    });
    $(".close-favorites-panel").click(closeFavoritesPanel);

    // patch number:
    $("#patch-dec").click(patchDec);
    $("#patch-inc").click(patchInc);

    setupKeyboard();

    // close all opened panel on outside click:
    $(document).mousedown(function(e) {
        $(".panel").each(function() {
            let element = $(this);
            if (element.is(":visible")) {
                // if the target of the click isn"t the container nor a descendant of the container
                if (!element.is(e.target)) {
                    if (element.has(e.target).length === 0) {
                        element.hide("slide", {direction: "left"}, 500);
                    }
                }
            }
        });
    });
*/

}

//==================================================================================================================
// Settings

var settings = {
    midi_channel: 1,
    randomize: ["lfo1", "lfo2", "osc1", "osc2", "sub", "mixer", "filter", "mod_env", "amp_env", "effects", "arp"],
    fade_unused: false
};

function loadSettings() {
}

function saveSettings() {
}

function setupSettings() {
}

function displayRandomizerSettings() {
}


//==================================================================================================================
// SysEx

/**
 * Send a sysex to the BS2 asking for it to send back a sysex dump of its current patch.
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
    if (!input) return;
    if (TRACE) console.log(`connect input to channel ${midi_channel}`);
    // if (input) {
    midi_input = input;
    // setStatus(`"${midi_input.name}" input connected.`);
    if (TRACE) console.log(`midi_input assigned to "${midi_input.name}"`);
    // }
    midi_input
        .on("programchange", midi_channel, function(e) {        // sent by the BS2 when changing patch
            handlePC(e);
        })
        .on("controlchange", midi_channel, function(e) {
            handleCC(e);
        })
        .on("sysex", midi_channel, function(e) {
            console.log("sysex handler");
            if (TRACE) console.log("update BS2 with sysex");
            // if (DEVICE.setValuesFromSysEx(e.data)) {
            //     updateUI();
            //     // setStatus("UI updated from SysEx.");
            //     if (TRACE) console.log("BS2 updated with sysex");
            // } else {
            //     setStatusError("Unable to update from SysEx data.")
            // }
        });
    console.log(`midi_input listening on channel ${midi_channel}`);
    setMidiInStatus(true);
    setStatus(`${DEVICE.name_device_in} connected on MIDI channel ${midi_channel}.`);
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

/**
 *
 * @param info
 */
function deviceConnect(info) {
    console.log("deviceConnect", info);
    // console.log("deviceConnect port type ***", typeof info.port);
    // console.log("deviceConnect port object ***", info.port);
    if ((info.port.name !== DEVICE.name_device_in) && (info.port.name !== DEVICE.name_device_out)) {
        console.log("ignore deviceConnect");
        return;
    }
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
            // ask the BS2 to send us its current patch:
            requestSysExDump();
        } else {
            console.log("deviceConnect: output already connected");
        }
    }
}

/**
 *
 * @param info
 */
function deviceDisconnect(info) {
    console.log("deviceDisconnect", info);
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
}

//==================================================================================================================
// Main

const VERSION = "[AIV]{version}[/AIV]";
const URL_PARAM_SYSEX = "sysex";    // name of sysex parameter in the query-string

var midi_input = null;
var midi_output = null;
var midi_channel = 1;

var knobs = {};         // svg-knob

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

            let input = WebMidi.getInputByName(DEVICE.name_device_in);
            if (input) {
                connectInput(input);
                setStatus(`${DEVICE.name_device_in} MIDI device connected on MIDI channel ${midi_channel}.`);
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
                // ask the BS2 to send us its current patch:
                requestSysExDump();
            }
*/

        }

    }, true);   // pass true to enable sysex support

});
