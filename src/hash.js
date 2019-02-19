import {TRACE} from "./debug";
import DEVICE from "./enzo/enzo";
import * as Utils from "./lib/utils";
import {updateUI} from "./ui";
import {fullUpdateDevice} from "./midi_out";
import {toHexString} from "./lib/utils";

let ignoreNextHashChange = false;

export function updateBookmark() {
    // window.location.href.split("?")[0] is the current URL without the query-string if any
    // return window.location.href.replace("#", "").split("?")[0] + "?" + URL_PARAM_SYSEX + "=" + toHexString(DEVICE.getSysEx());
    // return window.location.href.replace("#", "").split("?")[0] + "?" + URL_PARAM_SYSEX + "=" + toHexString(DEVICE.getSysEx());
    // window.location.hash = "" + URL_PARAM_SYSEX + "=" + toHexString(DEVICE.getSysEx())
    const h = toHexString(DEVICE.getSysEx());
    if (TRACE) console.log(`updateBookmark: set hash to ${h}`);
    ignoreNextHashChange = true;
    window.location.hash = h;
}

export function initFromBookmark(updateConnectedDevice = true) {
    if (TRACE) console.log(`initFromHash: ${window.location.hash}`);
    // let s = Utils.getParameterByName(URL_PARAM_SYSEX);
    const s = window.location.hash.substring(1);
    if (s) {
        if (TRACE) console.log("sysex hash present");               //TODO: check that the hash is a sysex hex string
        if (DEVICE.setValuesFromSysEx(Utils.fromHexString(s))) {
            if (TRACE) console.log("sysex loaded in device");
            updateUI();
            if (updateConnectedDevice) fullUpdateDevice();
        } else {
            if (TRACE) console.log("unable to set value from hash");
        }
    }
}

export function locationHashChanged(e) {
    if (TRACE) {
        const a = e.oldURL.substring(e.oldURL.indexOf('#')+1);
        const b = e.newURL.substring(e.newURL.indexOf('#')+1);
        console.log(`locationHashChanged from ${a} to ${b}`);
    }
    if (!ignoreNextHashChange) initFromBookmark();
    ignoreNextHashChange = false;
}

export function setupBookmarkSupport() {
    window.onhashchange = locationHashChanged;
}
