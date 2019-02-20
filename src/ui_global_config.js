import {TRACE} from "./debug";
import DEVICE from "./enzo/enzo";
import {sendSysEx} from "./midi_out";

export function setupGlobalConfig() {
    if (TRACE) console.log("setupGlobalConfig()");

    $("input[type='radio'].global-config").on("change", function(c) {
        const setting_number = parseInt(c.target.name.split("-")[1]);
        if (isNaN(setting_number)) {
            console.log("setupGlobalConfig: invalid setting number", c.target.name);
            return false;
        }
        const value = parseInt(c.target.value);
        if (isNaN(value)) {
            console.log("setupGlobalConfig: invalid value", c.target.value);
            return false;
        }
        if (TRACE) console.log(`setupGlobalConfig: ${setting_number}=${value}`);
        sendSysEx(DEVICE.getSysexDataForGlobalConfig(setting_number, value));
    });

    return true;
}
