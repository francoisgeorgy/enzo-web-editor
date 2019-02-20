import {TRACE} from "./debug";

export function openSettingsPanel() {
/*
    if (TRACE) console.log("toggle settings-panel");
    let e = $("#settings-panel");
    if (e.css("display") === "block") {
        e.hide("slide", {direction: "left"}, 500);
    } else {
        e.show("slide", {direction: "left"}, 500);
    }
*/
    const main = $("#main");
    if (main.is(".main-global-settings")) {
        $("#main").removeClass("main-global-settings").addClass("main-default");
        $("#menu-settings").parent(".menu-entry").removeClass("menu-active");
    } else {
        $("#main").removeClass("main-default").addClass("main-global-settings");
        $("#menu-settings").parent(".menu-entry").addClass("menu-active");
    }
    return false;   // disable the normal href behavior
}

export function closeSettingsPanel() {
    if (TRACE) console.log("closeSettingsPanel");
    $("#main").removeClass("main-global-settings").addClass("main-default");
    $("#menu-settings").parent(".menu-entry").removeClass("menu-active");
}
