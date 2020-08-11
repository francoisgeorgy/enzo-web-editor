import {log, warn} from "./debug";
import MODEL from "./model";
import {requestGlobalSettings, sendSysex} from "./midi_out";
import {hideDefaultPanel, showDefaultPanel} from "./ui";
import {closeAppPreferencesPanel} from "./ui_app_prefs";
import {appendMessage} from "./ui_messages";
import {closeHelpPanel} from "./ui_help";

const CONTAINER = "#global-settings";

export function openGlobalSettingsPanel() {
    hideDefaultPanel();
    closeAppPreferencesPanel();
    closeHelpPanel();
    $(CONTAINER).removeClass("closed");
    appendMessage("Request global settings");
    requestGlobalSettings();
    // updateGlobalConfig() will be called by the sysex handler after having received the global conf sysex response.
    return false;
}

export function closeGlobalSettingsPanel() {
    $(CONTAINER).addClass("closed");
    return false;
}

export function toggleGlobalSettingsPanel() {

/*
    if ($(CONTAINER).is(".closed")) {
        openGlobalSettingsPanel();
    } else {
        closeGlobalSettingsPanel();
        showDefaultPanel();
    }
*/
    return false;
}

export function setupGlobalSettings() {
    warn("setupGlobalSettings: TODO: v1.5");


    $('#toggle-global-lock').click(() => {
        log('#toggle-global-lock click');
        const unlock = $("#global-lock-opened");
        const lock = $("#global-lock-closed");
        if (unlock.is(".closed")) {
            log('unlock is closed');
            lock.addClass("closed");
            unlock.removeClass("closed");

            $('.global-setting-toggle').addClass('enabled');

        } else {
            log('unlock is NOT closed');
            unlock.addClass("closed");
            lock.removeClass("closed");

            $('.global-setting-toggle').removeClass('enabled');

        }
    });

    $(".global-setting-toggle").click((e) => {
        console.log(e.currentTarget.id);

        if ($("#global-lock-opened").is('.closed')) {
            log("locked, ignore");
        }

    });

    /*

    log("setupGlobalSettings()");

    $(".close-settings-panel").click(() => {
        closeGlobalSettingsPanel();
        showDefaultPanel();
    });

    $("input[type='radio'].global-config").on("change", function(c) {
        const setting_number = parseInt(c.target.name.split("-")[1]);
        if (isNaN(setting_number)) {
            log("setupGlobalSettings: invalid setting number", c.target.name);
            return false;
        }
        const value = parseInt(c.target.value);
        if (isNaN(value)) {
            log("setupGlobalSettings: invalid value", c.target.value);
            return false;
        }
        log(`setupGlobalSettings: ${setting_number}=${value}`);
        sendSysex(MODEL.getSysexDataForGlobalConfig(setting_number, value));
    });
*/
    return true;
}

/**
 * Update the UI from the MODEL controls values.
 */
export function updateGlobalSettings() {
    log("updateGlobalSettings()");
    for (let i=0; i < MODEL.global_conf.length; i++) {
        const g = MODEL.global_conf[i];
        $(`#global-${g.id}-${g.value}`).prop('checked', true);
    }
    log("updateGlobalSettings done");
}
