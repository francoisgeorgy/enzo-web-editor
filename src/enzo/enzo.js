import {control_id, control} from "./cc.js";

/**
 *
 * @returns {number}
 * @param ctrl
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
    return "raw_value" in ctrl ? ctrl.raw_value : 0;
};

/**
 * setControlValue(control_object, value)
 * setControlValue(control_type, control_number, value)
 * return the updated control object
 */
const setControlValue = function () {
    // console.log("BS2.setControlValue", ...arguments);
    let c;
    if (arguments.length === 2) {
        let value = arguments[1];
        c = arguments[0];
        c.raw_value = typeof value === "number" ? value : parseInt(value);
    } else if (arguments.length === 3) {
        let ca; // controls array
        if (arguments[0] === "cc") {                // [0] is control type
            ca = control;
        // } else if (arguments[0] === "nrpn") {
        //     ca = nrpn;
        } else {
            console.error("setControlValue: invalid control_type", arguments);
            return null;
        }
        if (ca[arguments[1]]) {                     // [0] is control number
            c = ca[arguments[1]];
            let value = arguments[2];               // [0] is control value
            c.raw_value = typeof value === "number" ? value : parseInt(value);
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
 * Only for CC, not for NRPN
 *
 * Returns an array of "midi messages" to send to update control to value
 * @param ctrl
 */
const getMidiMessagesForCC = function (ctrl) {
    // console.log("BS2.getMidiMessagesForControl", control_number, value);
    if (ctrl.cc_type !== "cc") return [];
    let CC = [];
    let value = getControlValue(ctrl);
    // if (ctrl.lsb < 0) {
        CC.push([ctrl.cc_number, value]);
    // } else {
    //     CC.push([ctrl.cc_number, value >>> 1]);          // we discard the lsb
    //     CC.push([ctrl.lsb, value % 2 === 0 ? 0 : 64]);   // that we put in the second CC message
    // }
    return CC;
};

export default {
    name: "Enzo",
    name_device_in: "Launch Control 2",
    name_device_out: "Launch Control 2",
    // meta,
    control_id,
    control,
    // nrpn,
    // control_groups,
    // SUB_WAVE_FORMS : consts.SUB_WAVE_FORMS,
    // SUB_OCTAVE : consts.SUB_OCTAVE,
    // OSC_RANGES : consts.OSC_RANGES,
    // OSC_WAVE_FORMS : consts.OSC_WAVE_FORMS,
    // COARSE_VALUES: consts.COARSE_VALUES,
    // LFO_WAVE_FORMS : consts.LFO_WAVE_FORMS,
    // LFO_SPEED_SYNC : consts.LFO_SPEED_SYNC,
    // LFO_SYNC : consts.LFO_SYNC,
    // FILTER_SHAPES : consts.FILTER_SHAPES,
    // FILTER_SLOPE : consts.FILTER_SLOPE,
    // FILTER_TYPE : consts.FILTER_TYPE,
    // ENV_TRIGGERING : consts.ENV_TRIGGERING,
    // ARP_NOTES_MODE : consts.ARP_NOTES_MODE,
    // ARP_OCTAVES : consts.ARP_OCTAVES,
    // ARP_SEQUENCES: consts.ARP_SEQUENCES,
    // TUNING_TABLE: consts.TUNING_TABLE,
    // init,
    // randomize,
    getControl,
    getControlValue,
    setControlValue,
    // getAllValues,
    // setAllValues,
    // setValuesFromSysEx: sysex.setDump,     // set values from a SysEx dump
    // getSysEx: sysex.getDump,     // export all values as a SysEx dump
    // validate: sysex.validate,   // validate a SysEx dump
    // doubleByteValue,
    getMidiMessagesForCC
};
