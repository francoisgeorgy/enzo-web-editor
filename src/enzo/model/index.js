// import {control_id} from "./cc.js";
// import meta from "./meta.js";
// import {global_conf, global_id} from "./global_conf";
// import * as sysex from "./sysex";
// import {
//     control,
//     copyFirstToSecondValues,
//     getControl,
//     getControlValue,
//     getControlValueExp,
//     getControlValueInter,
//     getMappedControlValue,
//     getMappedControlValueExp,
//     getPresetNumber,
//     init,
//     interpolateExpValues,
//     randomize,
//     setControlValue,
//     setDeviceId,
//     setPresetNumber,
//     supportsCC
// } from "../../shared/model";
// import {decodeSysex, validate} from "../../shared/model/sysex";

export const device_name = "Enzo";

export const LOCAL_STORAGE_KEY_PREFERENCES = "studiocode.enzo-editor-15.preferences";
export const LOCAL_STORAGE_KEY_LIBRARY = "studiocode.enzo-editor-15.library";

// export default {
//     name: "Enzo",
//     meta,
//     control_id,
//     control,
//     global_id,
//     global_conf,
//     getPresetNumber,
//     setPresetNumber,
//     init,
//     randomize,
//     setDeviceId,
//     getControl,
//     getControlValue,                        // default value
//     getMappedControlValue,
//     setControlValue,                        // default value
//     getControlValueExp,                     // second value (when EXP pedal fully closed)
//     getControlValueInter,                   // interpolated value (when using EXP)
//     getMappedControlValueExp,
//     supportsCC,
//     interpolateExpValues,                   // interpolate inter-value for controls that have two values
//     copyFirstToSecondValues,
//     validate: validate,               // validate a SysEx
//     setValuesFromSysEx: decodeSysex,  // decode a sysex and update model's values
//     getPreset: sysex.getPreset,             // export all values as a SysEx dump
//     getSysexDataForGlobalConfig: sysex.getSysexDataForGlobalConfig
// };
