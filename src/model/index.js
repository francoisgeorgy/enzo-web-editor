import {control_id, control} from "./cc.js";
import meta from "./meta.js";
import sysex from "./sysex.js";
import {global_conf, global_id} from "./global_conf";
import {log} from "../debug";

/**
 *
 * @returns {number}
 * @param number
 */
const getControl = function (number) {
    return control[number];
};

/**
 *
 * @returns {number}
 * @param ctrl
 */
const getControlValue = function (ctrl) {
    return "raw_value" in ctrl ? ctrl.raw_value : 0;        //TODO: raw_value should always exist
};

const getMappedControlValue = function (ctrl) {
    const v = "raw_value" in ctrl ? ctrl.raw_value : 0;     //TODO: raw_value should always exist
    return ctrl.hasOwnProperty("map_raw") ? ctrl.map_raw(v) : v;
};

// const getControlValue2 = function (ctrl) {
//     return ctrl.two_values ? ctrl.raw_value2 : ctrl.raw_value;              //TODO: return null if not two_values?
// };
//
// const getMappedControlValue2 = function (ctrl) {
//     const v = ctrl.two_values in ctrl ? ctrl.raw_value2 : ctrl.raw_value;   //TODO: return null if not two_values?
//     return ctrl.hasOwnProperty("map_raw") ? ctrl.map_raw(v) : v;
// };

const getControlValueExp = function (ctrl) {
    return ctrl.two_values ? ctrl.raw_value_exp : ctrl.raw_value;
};

const getMappedControlValueExp = function (ctrl) {
    const v = ctrl.two_values in ctrl ? ctrl.raw_value_exp : ctrl.raw_value;
    return ctrl.hasOwnProperty("map_raw") ? ctrl.map_raw(v) : v;
};

/**
 * setControlValue(control_object, value)
 * setControlValue(control_type, control_number, value, boolean value2)
 * return the updated control object
 */
const setControlValue = function () {
    // console.log("BS2.setControlValue", ...arguments);
    let c;
    if (arguments.length === 2) {
        let value = arguments[1];
        const v = typeof value === "number" ? value : parseInt(value);
        c = arguments[0];
        if (c.hasOwnProperty("map_raw")) {
            c.raw_value = c.map_raw(v);
        } else {
            c.raw_value = v;
        }
    } else if (arguments.length >= 3) {
        let ca; // controls array
        if (arguments[0] === "cc") {                // [0] is control type
            ca = control;
        // } else if (arguments[0] === "nrpn") {
        //     ca = nrpn;
        } else {
            console.error("setControlValue: invalid control_type", arguments);
            return null;
        }
        if (ca[arguments[1]]) {                     // [1] is control number
            let value = arguments[2];               // [2] is control value
            const v = typeof value === "number" ? value : parseInt(value);
            c = ca[arguments[1]];

            const set_value2 = c.two_values && (arguments.length > 3) && arguments[3];

            if (c.hasOwnProperty("map_raw")) {
                c[set_value2 ? "raw_value2" : "raw_value"] = c.map_raw(v);
            } else {
                c[set_value2 ? "raw_value2" : "raw_value"] = v;
            }
        } else {
            console.error("setControlValue: unknown number", arguments);
            return null;
        }
    } else {
        console.error("setControlValue: invalid arguments", arguments);
        return null;
    }
    return c;
};

/**
 * for each control that can be modified by EXP, do value_exp = f(value_start, value_end, exp_value)
 * raw_value and raw_value2 are not modified, they are the values saved in the preset
 * the interpolated value is raw_value_exp
 * @param exp_value
 */
const interpolateExpValues = function (exp_value) {
    // log("interpolateExpValues");
    for (let i = 0; i < control.length; i++) {
        let c = control[i];
        if (typeof c === "undefined") continue;
        if (!c.two_values) {
            continue;
        }
        // compute value corresponding the the EXP position (exp_value):
        if ((exp_value === 0) || (c.raw_value2 === c.raw_value)) {
            c.raw_value_exp = c.raw_value;
        // } else if (exp_value === 127) || (c.raw_value2 === c.raw_value)) {
        //         c.raw_value_exp = c.raw_value2;
        } else {
            c.raw_value_exp = Math.round((c.raw_value2 - c.raw_value) / 127 * exp_value) + c.raw_value;
        }
        // log(`interpolateExpValues: CC ${i}: ${c.raw_value_exp} = f(${c.raw_value}, ${c.raw_value2}, ${exp_value})`);
    }
};

/**
 *
 */
const init = function () {
    for (let i = 0; i < control.length; i++) {
        let c = control[i];
        if (typeof c === "undefined") continue;
        if (c.hasOwnProperty("no_init")) {
            continue;
        }
        c.raw_value = c.init_value;
        c.value = c.human(c.raw_value);
    }

    meta.preset_id.value = 0;
};

function getRandomValue(c) {
    let v;
    // if (c.hasOwnProperty("randomize")) {
    //     v = c.randomize;
    // } else {
    if (c.on_off) {
        v = Math.round(Math.random());
    } else {
        let min = Math.min(...c.cc_range);
        v = Math.round(Math.random() * (Math.max(...c.cc_range) - min)) + min;  //TODO: step
    }
    if (c.hasOwnProperty("map_raw")) {
        v = c.map_raw(v);
    }
    // }
    return v;
}

const randomize = function() {

    for (let i = 0; i < control.length; i++) {

        const c = control[i];
        if (typeof c === "undefined") continue;

        if (c.no_randomize) continue;

/*
        let v;
        // if (c.hasOwnProperty("randomize")) {
        //     v = c.randomize;
        // } else {
            if (c.on_off) {
                v = Math.round(Math.random());
            } else {
                let min = Math.min(...c.cc_range);
                v = Math.round(Math.random() * (Math.max(...c.cc_range) - min)) + min;  //TODO: step
            }
            if (c.hasOwnProperty("map_raw")) {
                v = c.map_raw(v);
            }
        // }
        c.raw_value = v;
*/
        c.raw_value = getRandomValue(c);
        c.randomized = true;

        if (c.two_values) {
            c.raw_value2 = getRandomValue(c);
        }

    }

    meta.preset_id.value = 0;

};

/**
 * Only for CC, not for NRPN
 *
 * Returns an array of "midi messages" to send to update control to value
 * @param ctrl
 */
/*
const getMidiMessagesForCC = function (ctrl) {
    if (ctrl.cc_type !== "cc") return [];
    let CC = [];
    let value = getControlValue(ctrl);
    CC.push([ctrl.cc_number, value]);
    return CC;
};
*/

const setDeviceId = function (id) {
    meta.device_id.value = id;
};

//TODO: getHumanValue() or getValue()

export default {
    name: "Enzo",
    meta,
    control_id,
    control,
    global_id,
    global_conf,
    init,
    randomize,
    setDeviceId,
    getControl,
    getControlValue,
    getMappedControlValue,
    setControlValue,
    getControlValueExp,
    getMappedControlValueExp,
    interpolateExpValues,
    setValuesFromSysEx: sysex.setDump,     // set values from a SysEx dump
    getSysex: sysex.getDump,     // export all values as a SysEx dump
    getSysexDataForGlobalConfig: sysex.getSysexDataForGlobalConfig,
    validate: sysex.validate   // validate a SysEx dump
};
