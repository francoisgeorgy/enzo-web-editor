import MODEL from "@model";
import {handleUserAction, updateControl} from "@shared/controller";
import {updateMomentaryFootswitch} from "@shared/switches";
import {updateDevice} from "@shared/midi/midiOut";
import {log} from "@utils/debug";

let tap_timestamp = 0;

/**
 *
 * @param id
 */
export function tapDown(id) {

    //TODO: compute tempo on an average of at least 3 values

    log(`tapDown(${id})`);

    updateMomentaryFootswitch(id, 127);

    const t = Date.now();
    handleUserAction(...id.split("-"));
    const dt = t - tap_timestamp;
    tap_timestamp = t;

    if (dt < 5000) {    // if more than 5 sec, reset
        const bpm = Math.round(60000 / dt);
        const cc_value = Math.min(dt / 10, 127);
        updateDevice("cc", MODEL.control_id.tempo, cc_value);
        updateControl("cc", MODEL.control_id.tempo, cc_value);
    }
}

/**
 *
 * @param id
 */
export function tapRelease(id) {
    log(`tapRelease(${id})`);
    updateMomentaryFootswitch(id, 0);
}

export function setupFootswitches() {
    //
    // momentary action:
    //
    $(".momentary-switch")
        .mousedown(function () {
            tapDown(this.id)
        })
        .mouseup(function () {
            tapRelease(this.id)
        });
}
