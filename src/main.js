import {log} from "@utils/debug";
import MODEL from "./enzo/model";
import {detect} from "detect-browser";
import {loadPreferences, preferences} from "./shared/preferences";
import {setupUI} from "./shared/appSetup";
import {initMidi} from "@midi";
import * as serviceWorker from "./serviceWorker";
import {handleUrlParameters} from "@shared/url";
import "@fontsource/roboto-condensed/300.css";
import "@fontsource/roboto-condensed/400.css";
import "@fontsource/roboto-condensed/700.css";
import "@fontsource/roboto-condensed/300-italic.css";
import "@fontsource/roboto-condensed/400-italic.css";
import "@fontsource/roboto-condensed/700-italic.css";
import "./css/lity.min.css"; // CSS files order is important
import "./css/themes.css";
import "./css/main.css";
import "./css/header.css";
import "./css/size.css";
import "./css/config.css";
import "./css/info-panel.css";
import "./css/presets.css";
import "./css/controls.css";
import "./css/buttons.css";
import "./css/dialogs.css";
import "./css/global-settings.css";

export const VERSION = "[AIV]{version}[/AIV]";

//==================================================================================================================
// Setup the worker for the offline support (PWA):

if ("serviceWorker" in navigator) {
    window.addEventListener("load", function() {
        navigator.serviceWorker
            .register(
                "./serviceWorker.js"
            )
            .then(res => console.log("service worker registered"))
            .catch(err => console.log("service worker not registered", err))
    })
}

//==================================================================================================================
// Check if the browser is supported:

const browser = detect();

if (browser) {
    // log(browser.name);
    // log(browser.version);
    switch (browser && browser.name) {
        case "chrome":
            break;
        case "firefox":
        case "edge":
        default:
            log("unsupported browser");
            alert("Please use Chrome browser (recent version recommended). " +
                "Any other browser is unsupported at the moment and the application may not work properly or not work at all. " +
                "Thank you for your understanding.");
    }
}

//==================================================================================================================
// Main

$(function () {

    log(`${MODEL.name} editor ${VERSION}`);

    loadPreferences();

    MODEL.init();
    MODEL.setDeviceId(preferences.midi_channel - 1);   // the device_id is the midi channel - 1

    setupUI();

    handleUrlParameters();

    initMidi();

});
