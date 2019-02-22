import {log} from "./debug";
import {closeSettingsPanel} from "./ui_global_settings";
import {hideDefaultPanel, showDefaultPanel} from "./ui";

const CONTAINER = "#app-preferences";

export function openAppPreferencesPanel() {
    hideDefaultPanel();
    closeSettingsPanel();
    $(CONTAINER).removeClass("closed");
    return false;
}

export function closeAppPreferencesPanel() {
    $(CONTAINER).addClass("closed");
    return false;
}

export function setupAppPreferences() {
    log("setupAppPreferences()");

    $(".close-app-prefs-panel").click(() => {
        closeAppPreferencesPanel();
        showDefaultPanel();
    });

    $("input[type='radio'].app-pref").on("change", function(c) {
        // TODO
    });
    return true;
}
