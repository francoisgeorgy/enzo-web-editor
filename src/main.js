import {TRACE} from "./debug";
import * as Utils from "./lib/utils.js";
import * as WebMidi from "webmidi";
import {detect} from "detect-browser";
import DEVICE from "./enzo/enzo.js";
import {URL_PARAM_SYSEX, VERSION} from "./constants";
import {loadSettings, saveSettings, settings} from "./settings";
import {clearError, clearStatus, MSG_SEND_SYSEX, setMidiInStatus, setStatus, setStatusError} from "./ui_messages";
import {setupUI, updateUI} from "./ui";
import {updateSelectDeviceList} from "./ui_selects";
import {getMidiInputPort, handleCC, handlePC, handleSysex, setMidiInputPort} from "./midi_in";
import {fullUpdateDevice, getMidiOutputPort, setMidiOutputPort} from "./midi_out";
import "./css/lity.min.css";
import "./css/main.css";
import "./css/grid.css";
import "./css/layout.css";
import "./css/knob.css";
import {initFromBookmark, locationHashChanged, setupBookmarkSupport} from "./hash";

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

//==================================================================================================================

function setMidiChannel(midi_channel) {

    // Note: output does not use any event listener, so there's nothing to update on the output device when we only
    //       change the MIDI channel.

    if (TRACE) console.log(`setMidiChannel(${midi_channel}): disconnect input`);
    disconnectInputPort();

    // Set new channel:
    if (TRACE) console.log(`setMidiChannel(${midi_channel}): set new channel`);
    saveSettings({midi_channel});

    if (TRACE) console.log(`setMidiChannel(${midi_channel}): reconnect input ${settings.input_device_id}`);
    connectInputDevice(settings.input_device_id);
}

//==================================================================================================================
// WebMidi events handling

function disconnectInputPort() {
    if (TRACE) console.log("disconnectInput()");
    const p = getMidiInputPort();
    if (p) {
        p.removeListener();    // remove all listeners for all channels
        setMidiInputPort(null);
        if (TRACE) console.log("midi_input not listening");
    }
    setStatus(`Device disconnected.`);
}

function connectInputPort(input) {

    if (TRACE) console.log("connectInput()");

    if (!input) return;

    setMidiInputPort(input);
    if (TRACE) console.log(`midi_input assigned to "${input.name}"`);

    input
        .on("programchange", settings.midi_channel, function(e) {
            handlePC(e.data);
        })
        .on("controlchange", settings.midi_channel, function(e) {
            handleCC(e.data);
        })
        .on("sysex", settings.midi_channel, function(e) {
            handleSysex(e.data);
        });

    if (TRACE) console.log(`${input.name} listening on channel ${settings.midi_channel}`);
    setMidiInStatus(true);
    clearError();
    setStatus(`${input.name} connected on MIDI channel ${settings.midi_channel}.`, MSG_SEND_SYSEX);

}

function disconnectOutputPort() {
    if (TRACE) console.log("disconnectOutput()");
    setMidiOutputPort(null);
}

function connectOutputPort(output) {
    if (TRACE) console.log("connect output");
    setMidiOutputPort(output);
    if (TRACE) console.log(`midi_output assigned to "${output.name}"`);
}

function connectInputDevice(id) {

    if (TRACE) console.log(`setInputDevice(${id})`);

    if (!id) {
        return;
    }

    // do nothing if already connected
    const p = getMidiInputPort();
    if (p && (p.id === id)) {
        if (TRACE) console.log(`setInputDevice(${id}): port is already connected`);
        return;
    }

    // save in settings for autoloading at next restart:
    saveSettings({input_device_id: id});

    // We only handle one connection, so we disconnected any connected port before connecting the new one.
    disconnectInputPort();

    const port = WebMidi.getInputById(id);
    if (port) {
        connectInputPort(port);
    } else {
        clearStatus();
        setStatusError(`Please connect your device or check the MIDI channel.`);
        setMidiInStatus(false);
    }
}

function connectOutputDevice(id) {

    if (TRACE) console.log(`setOutputDevice(${id})`);

    if (!id) {
        return;
    }

    // do nothing if already connected
    const p = getMidiOutputPort();
    if (p && (p.id === id)) {   //TODO: make as a function in midi_out.js
        if (TRACE) console.log(`setOutputDevice(${id}): port is already connected`);
        return;
    }

    const port = WebMidi.getOutputById(id);

    if (TRACE) console.log(`%csetOutputDevice${id}): will use [${port.type} ${port.id} ${port.name}] as output`, "color: green; font-weight: bold");

    // save in settings for autoloading at next restart:
    settings.output_device_id = id;
    saveSettings();

    // We only handle one connection, so we disconnected any connected port before connecting the new one.
    disconnectOutputPort();

    if (port) {
        connectOutputPort(port);
    } else {
        clearStatus();
        setStatusError(`Please connect your device or check the MIDI channel.`);
    }
}

/**
 *
 * @param info
 */
function deviceConnected(info) {
    if (TRACE) console.log("%cdeviceConnected", "color: yellow; font-weight: bold", info.type, info.port.type, info.port.id, info.port.name);

    // Auto-connect if not already connected.
    if (getMidiInputPort() === null) connectInputDevice(settings.input_device_id);
    if (getMidiOutputPort() === null) connectOutputDevice(settings.output_device_id);

    updateSelectDeviceList();
}

/**
 *
 * @param info
 */
function deviceDisconnected(info) {
    if (TRACE) console.log("%cdeviceDisconnected", "color: orange; font-weight: bold", info.type, info.port.type, info.port.id, info.port.name);

    const p_in = getMidiInputPort();
    if (p_in && info.port.id === p_in.id) {
        disconnectInputPort();
    }
    const p_out = getMidiOutputPort();
    if (p_out && info.port.id === p_out.id) {       //TODO: make as a function in midi_out.js
        disconnectOutputPort();
    }
    updateSelectDeviceList();
}

function autoConnect() {
    if (settings) {
        //AUTO CONNECT
        connectInputDevice(settings.input_device_id);
        connectOutputDevice(settings.output_device_id);
        updateSelectDeviceList();
    }
}

//==================================================================================================================
// Main

$(function () {

    if (TRACE) console.log(`Enzo Web Interface ${VERSION}`);

    loadSettings();
    setupUI(setMidiChannel, connectInputDevice, connectOutputDevice);
    setupBookmarkSupport();
    setStatus("Waiting for MIDI interface access...");

    WebMidi.enable(function (err) {

        if (err) {

            console.warn("webmidi err", err);

            setStatusError("ERROR: WebMidi could not be enabled.");

            // Even we don't have MIDI available, we update at least the UI:
            initFromBookmark(false);

        } else {

            if (TRACE) console.log("webmidi ok");

            setStatus("WebMidi enabled.");

            if (TRACE) {
                WebMidi.inputs.map(i => console.log("available input: ", i));
                WebMidi.outputs.map(i => console.log("available output: ", i));
            }

            WebMidi.addListener("connected", e => deviceConnected(e));
            WebMidi.addListener("disconnected", e => deviceDisconnected(e));

            autoConnect();
            initFromBookmark();

        }

    }, true);   // pass true to enable sysex support

});
