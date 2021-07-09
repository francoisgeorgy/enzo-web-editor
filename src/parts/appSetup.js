import MODEL from "../model";
import "webpack-jquery-ui/effects";
import {_tempo_bpm, _tempo_ms, control_id} from "../model/cc";
import {displayRawValues, setupKnobs} from "./knobs";
import {enableKeyboard, setupKeyboard} from "./shortcutKeys";
import {fullUpdateDevice, savePreset} from "./midi/midiOut";
import {handleUserAction, updateControl} from "./controller";
import {init, randomize, setupPresetSelectors} from "./presets";
import {initSize, zoomIn, zoomOut} from "./windowSize";
import {log, TRACE} from "../utils/debug";
import {preferences} from "./preferences";
import {printPreset} from "./dialogs";
import {setCommunicationStatus} from "./midi/messages";
import {setupExp} from "./expController";
import {setupGlobalSettings} from "./globalSettings";
import {setupMomentarySwitches, setupSwitches, tapDown, tapRelease} from "./switches";
import {setupPresetsLibrary} from "./presetLibrary/preset_library";
import {setupTooltips} from "./tooltips";
import {VERSION} from "./constants";

function setupSelects(channelSelectionCallback, inputSelectionCallback, outputSelectionCallback, input2ChannelSelectionCallback, input2SelectionCallback) {

    $("#midi-channel")
        .change((event) => channelSelectionCallback(event.target.value))
        .val(preferences.midi_channel);

    $("#midi-input-device")
        .change((event) => inputSelectionCallback(event.target.value));

    $("#midi-output-device")
        .change((event) => outputSelectionCallback(event.target.value));

    $("#midi-input2-channel")
        .change((event) => input2ChannelSelectionCallback(event.target.value))
        .val(preferences.input2_channel);

    $("#midi-input2-device")
        .change((event) => input2SelectionCallback(event.target.value));
}

function setupControlsHelp() {

    $(".header.infos").hover(
        function() {

            const cc = parseInt($(this).attr("data-infos"), 10);

            //TODO: lock for randomizer
            //$(`.control-lock.control-${cc}`).removeClass('hidden');

/*
 * TODO: enable #info-panel

            if ($('#info-panel').is('.closed')) return;

            // if (!preferences.display_infos) return;
            // const cc = parseInt($(this).attr("data-infos"), 10);
            if (!Number.isInteger(cc)) {
                log(`setupControlsHelp: invalid CC: ${cc}`);
                return;
            }
            $("#control-infos").html("<b>" + MODEL.control[cc].name + "</b> : " + MODEL.control[cc].infos.replace("\n", "<br />"));
*/

        },
        function() {

            //TODO: lock for randomizer
            $('.control-lock').addClass('hidden');

/*
 * TODO: enable #info-panel

            // if (!preferences.display_infos) return;
            if ($('#info-panel').is('.closed')) return;
            $("#control-infos").text("");   //.hide();
*/

        }
    );

}

//TODO: lock for randomizer
/*
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
export function setupUI(channelSelectionCallback, inputSelectionCallback, outputSelectionCallback, input2ChannelSelectionCallback, input2SelectionCallback) {

    if (TRACE) console.groupCollapsed("setupUI");

    $("span.version").text(VERSION);

    initSize(preferences.zoom_level);

    setCommunicationStatus(false);
    setupPresetSelectors(handleUserAction);
    setupKnobs(handleUserAction);
    setupSwitches(handleUserAction);
    setupMomentarySwitches(tapDown, tapRelease);
    setupExp(handleUserAction);
    setupGlobalSettings();
    setupControlsHelp();
    setupMenu();
    setupTooltips();
    setupPresetsLibrary();
    setupSelects(channelSelectionCallback, inputSelectionCallback, outputSelectionCallback, input2ChannelSelectionCallback, input2SelectionCallback);
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
