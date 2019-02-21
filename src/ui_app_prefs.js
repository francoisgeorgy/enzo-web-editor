import {TRACE} from "./debug";
import {closeSettingsPanel} from "./ui_global_settings";
import {hideDefaultPanel, showDefaultPanel} from "./ui";

const CONTAINER = "#app-preferences";
// const MENU_ENTRY = "#menu-prefs";

/*
export function toggleAppPreferencesPanel() {
    const main = $("#main");
    closeAppPreferencesPanel();
    if (main.is(".settings-view")) {
        closeAppPreferencesPanel();
        closeSettingsPanel();
        showDefaultPanel();
        $(MENU_ENTRY).parent(".menu-entry").removeClass("menu-active");
    } else {
        main.removeClass("main-default").addClass("settings-view");
        $(CONTAINER).removeClass("closed");
        $(MENU_ENTRY).parent(".menu-entry").addClass("menu-active");
    }
    return false;   // disable the normal href behavior
}
*/

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
    if (TRACE) console.log("setupAppPreferences()");

    $(".close-app-prefs-panel").click(() => {
        closeAppPreferencesPanel();
        showDefaultPanel();
    });

    $("input[type='radio'].app-pref").on("change", function(c) {
        // TODO
    });
    return true;
}
