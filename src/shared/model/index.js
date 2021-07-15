import meta from "@device/meta";
import {device_name} from "@device";
import {control_id, defineControls} from "@device/cc";
import {global_conf, global_id} from "@device/global_conf";
import {getPresetBytes, decodeSysex, validate} from "@model/sysex";
import {getDataForGlobalConfig} from "@device/sysex";

export const control = new Array(127);

export const _0_100 = function (v) {
    return Math.floor(v / 127 * 100 + 0.5);
};

export const _percent = function (v) {
    return Math.floor(v / 127 * 100 + 0.5) + '%';
};

export const _off_when_zero_percent = function (v) {
    return v === 0 ? 'OFF' : _percent(v);
};

export const _2_steps = function (v) {
    return v < 64 ? 0 : 127;
};

export const _4_steps = function (v) {
    if (v < 32) {
        return 0;
    } else if (v < 64) {
        return 63;
    } else if (v < 96) {
        return 95;
    } else {
        return 127;
    }
};

export const _tempo_ms = function (v) {
    return (v * 10);    // + "ms";
};

export const _tempo_bpm = function (v) {
    // console.log("tempo bpm", v, Math.round(60000 / (v * 10)));
    const bpm = v > 0 ? Math.round(60000 / (v * 10)) : 0;
    return `${bpm}`;
};

export const getControl = function (number) {
    return control[number];
};

export const getControlValue = function (ctrl) {
    return ctrl.raw_value;
};

export const getMappedControlValue = function (ctrl) {
    return ctrl.hasOwnProperty("map_raw") ? ctrl.map_raw(ctrl.raw_value) : ctrl.raw_value;
};

export const getControlValueInter = function (ctrl) {
    return ctrl.two_values ? ctrl.raw_value_inter : ctrl.raw_value;
};

export const getControlValueExp = function (ctrl) {
    return ctrl.two_values ? ctrl.raw_value2 : ctrl.raw_value;
};

export const getMappedControlValueExp = function (ctrl) {
    const v = ctrl.two_values in ctrl ? ctrl.raw_value_inter : ctrl.raw_value;
    return ctrl.hasOwnProperty("map_raw") ? ctrl.map_raw(v) : v;
};

export const supportsCC = function (control_number) {
    return control[control_number] !== undefined;   // we could simple use !! but it's ugly.
};

/**
 * setControlValue(control_object, value)
 * setControlValue(control_type, control_number, value, boolean value2)
 * return the updated control object
 */
export const setControlValue = function () {
    let c;
    if (arguments.length === 2) {

        // args are control_object and value

        let value = arguments[1];
        const v = typeof value === "number" ? value : parseInt(value);
        c = arguments[0];
        if (c.hasOwnProperty("map_raw")) {
            c.raw_value = c.map_raw(v);
        } else {
            c.raw_value = v;
        }
    } else if (arguments.length >= 3) {

        // args are control_type, control_number, value, and bool value2

        let ca; // controls array
        if (arguments[0] === "cc") {                // [0] is control type
            ca = control;
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
export const interpolateExpValues = function (exp_value) {
    // log("interpolateExpValues");
    for (let i = 0; i < control.length; i++) {
        let c = control[i];
        if (typeof c === "undefined") continue;
        if (!c.two_values) {
            continue;
        }
        // compute value corresponding the the EXP position (exp_value):
        if ((exp_value === 0) || (c.raw_value2 === c.raw_value)) {
            c.raw_value_inter = c.raw_value;
            // } else if (exp_value === 127) || (c.raw_value2 === c.raw_value)) {
            //         c.raw_value_exp = c.raw_value2;
        } else {
            c.raw_value_inter = Math.round((c.raw_value2 - c.raw_value) / 127 * exp_value) + c.raw_value;
        }
    }
};

/**
 * Set convenient "default" values.
 */
export const init = function () {
    for (let i = 0; i < control.length; i++) {
        let c = control[i];
        if (typeof c === "undefined") continue;
        if (c.hasOwnProperty("no_init")) {
            continue;
        }
        c.raw_value = c.init_value;
        c.value = c.human(c.raw_value);
        if (c.two_values) {
            c.raw_value2 = c.raw_value;
        }
    }
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

/**
 * Set random values for all controls.
 */
export const randomize = function () {
    for (let i = 0; i < control.length; i++) {
        const c = control[i];
        if (typeof c === "undefined") continue;
        if (c.no_randomize) continue;
        c.raw_value = getRandomValue(c);
        if (c.two_values) {
            c.raw_value2 = getRandomValue(c);
        }
    }
};

export const copyFirstToSecondValues = function () {
    for (let i = 0; i < control.length; i++) {
        const c = control[i];
        if (typeof c === "undefined") continue;
        if (c.two_values) {
            c.raw_value2 = c.raw_value;
        }
    }
};

export const setDeviceId = function (id) {
    meta.device_id.value = id;
};

export const getPresetNumber = function () {
    return meta.preset_id.value;
};

export const setPresetNumber = function (n) {
    meta.preset_id.value = n;
};

export default {
    name: device_name,
    meta,
    control_id,
    control,
    global_id,
    global_conf,
    getPresetNumber,
    setPresetNumber,
    init,
    randomize,
    setDeviceId,
    getControl,
    getControlValue,                        // default value
    getMappedControlValue,
    setControlValue,                        // default value
    getControlValueExp,                     // second value (when EXP pedal fully closed)
    getControlValueInter,                   // interpolated value (when using EXP)
    getMappedControlValueExp,
    supportsCC,
    interpolateExpValues,                   // interpolate inter-value for controls that have two values
    copyFirstToSecondValues,
    validate: validate,               // validate a SysEx
    setValuesFromSysEx: decodeSysex,  // decode a sysex and update model's values
    getPreset: getPresetBytes,             // export all values as a SysEx dump
    getSysexDataForGlobalConfig: getDataForGlobalConfig
};


defineControls();
