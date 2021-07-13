import MODEL from "@model";
import "webpack-jquery-ui/effects";
import {log, TRACE} from "@utils/debug";
import {_tempo_bpm, _tempo_ms, control_id} from "@model/cc";
import {displayRawValues, setupKnobs} from "@shared/knobs";
import {fullUpdateDevice, savePreset} from "@midi/midiOut";
import {handleUserAction, updateControl} from "@shared/controller";
import {init, randomize, setupPresetSelectors} from "@shared/presets";
import {initSize, zoomIn, zoomOut} from "@shared/windowSize";
import {preferences} from "@shared/preferences";
import {printPreset} from "@shared/dialogs";
// import {setCommunicationStatus} from "@midi/messages";
import {setupExp} from "@shared/expController";
import {setupGlobalSettings} from "@shared/globalSettings";
import {setupMomentarySwitches, setupSwitches, tapDown, tapRelease} from "@shared/switches";
import {setupPresetsLibrary} from "@shared/preset_library";
import {setupTooltips} from "@shared/tooltips";
import {
    connectInput2Device,
    connectInputDevice,
    connectOutputDevice,
    setMidiChannel,
    setMidiInput2Channel
} from "@midi";
import {enableKeyboard, setupKeyboard} from "@shared/keyboardSupport";

export const VERSION = "[AIV]{version}[/AIV]";

function setupSelects() {

    $("#midi-channel")
        .change((event) => setMidiChannel(event.target.value))
        .val(preferences.midi_channel);

    $("#midi-input-device")
        .change((event) => connectInputDevice(event.target.value));

    $("#midi-output-device")
        .change((event) => connectOutputDevice(event.target.value));

    $("#midi-input2-channel")
        .change((event) => setMidiInput2Channel(event.target.value))
        .val(preferences.input2_channel);

    $("#midi-input2-device")
        .change((event) => connectInput2Device(event.target.value));
}

function setupControlsHelp() {

    $(".header.infos").hover(
        function() {
            const cc = parseInt($(this).attr("data-infos"), 10);
            //TODO: lock for randomizer
            //$(`.control-lock.control-${cc}`).removeClass('hidden');
        },
        function() {
            //TODO: lock for randomizer
            $('.control-lock').addClass('hidden');
        }
    );

}

/*
//TODO: lock for randomizer
function setupControlsLocks() {
    $(".header.infos").hover(
        function() {
            $('.control-lock').removeClass('hidden');
        },
        function() {
            $('.control-lock').addClass('hidden');
        }
    );
}
*/

function setupMenu() {
    log("setupMenu()");
    $(document).on('lity:close', function(event, instance) {
        enableKeyboard();
    });
    $("#menu-randomize").click(randomize);
    $("#menu-init").click(init);
    $("#menu-save").click(savePreset);
    $("#menu-print-preset").click(printPreset);
    $("#menu-send").click(fullUpdateDevice);
    $("#menu-size-in").click(zoomIn);
    $("#menu-size-out").click(zoomOut);
}

/**
 * Initial setup of the UI.
 * Does a MODEL.init() too, but only the virtual MODEL; does not send any CC to the connected device.
 */
export function setupUI() {

    if (TRACE) console.groupCollapsed("setupUI");

    $("span.version").text(VERSION);

    initSize(preferences.zoom_level);

    // setCommunicationStatus(false);
    setupPresetSelectors(handleUserAction);
    setupKnobs(handleUserAction);
    setupSwitches(handleUserAction);
    setupMomentarySwitches(tapDown, tapRelease);    // ENZO SPECIFIC; FIXME: add device specific method
    setupExp(handleUserAction);
    setupGlobalSettings();
    setupControlsHelp();
    setupMenu();
    setupTooltips();
    setupPresetsLibrary();
    setupSelects();
    setupKeyboard();

    $('#tempo-label').click(() => {
        const c = MODEL.control[control_id.tempo];
        if (c.human === _tempo_bpm) {
            c.human = _tempo_ms;
            $('#tempo-label').text('tempo MS');
        } else {
            c.human = _tempo_bpm;
            $('#tempo-label').text('tempo BPM');
        }
        updateControl(c.cc_type, control_id.tempo, MODEL.getControlValue(c), MODEL.getMappedControlValue(c));
    });

    $(window).blur(function(){
        displayRawValues(false);    // when switching window with Alt-Tab
    });

    if (TRACE) console.groupEnd();
}
