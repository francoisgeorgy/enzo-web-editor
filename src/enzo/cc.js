// import * as consts from './constants.js';
// import mapper from './mappers.js';

export const control_id = {
    exp_pedal: 4,
    envelope_type: 9,
    bypass: 14,
    tempo: 15,
    pitch: 16,
    filter: 17,
    mix: 18,
    sustain: 19,
    filter_envelope: 20,
    modulation: 21,
    portamento: 22,
    filter_type: 23,
    delay_level: 24,
    ring_modulation: 25,
    filter_bandwidth: 26,
    delay_feedback: 27,
    tap: 28,
    synth_mode: 29,
    synth_waveshape: 30
};

export const control = new Array(127);

const _2_steps = function (v) {
    return v < 64 ? 0 : 127;
};

const _4_steps = function (v) {
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

const _filter_type = function (v) {
    return v;
};

function defineControls() {
    // control[control_id.exp_pedal] = { // 4,
    //     name: "Exp pedal",
    //     sysex: {
    //         offset: 22,
    //         mask: [0x7F]
    //     }
    // };
    // control[control_id.tempo] = { // 15,
    //     name: "tempo",
    //     sysex: {
    //         offset: 22,
    //         mask: [0x7F]
    //     }
    // };
    control[control_id.pitch] = { // 16,
        name: "pitch",
        sysex: {
            offset: 9,
            mask: [0x7F]
        }
    };
    control[control_id.filter] = { // 17,
        name: "filter",
        sysex: {
            offset: 10,
            mask: [0x7F]
        }
    };
    control[control_id.mix] = { // 18,
        name: "mix",
        sysex: {
            offset: 11,
            mask: [0x7F]
        }
    };
    control[control_id.sustain] = { // 19,
        name: "sustain",
        sysex: {
            offset: 12,
            mask: [0x7F]
        }
    };
    control[control_id.filter_envelope] = { // 20,
        name: "filter env",
        sysex: {
            offset: 13,
            mask: [0x7F]
        }
    };
    control[control_id.modulation] = { // 21,
        name: "modulation",
        sysex: {
            offset: 14,
            mask: [0x7F]
        }
    };
    control[control_id.portamento] = { // 22,
        name: "portamento",
        sysex: {
            offset: 15,
            mask: [0x7F]
        }
    };
    control[control_id.filter_type] = { // 23,
        name: "filter type",
        human: _filter_type,
        sysex: {
            offset: 16,
            mask: [0x7F]
        }
    };
    control[control_id.delay_level] = { // 24,
        name: "delay level",
        sysex: {
            offset: 17,
            mask: [0x7F]
        }
    };
    control[control_id.ring_modulation] = { //  25,
        name: "ring mod",
        sysex: {
            offset: 18,
            mask: [0x7F]
        }
    };
    control[control_id.filter_bandwidth] = { // 26,
        name: "filter bandwidth",
        sysex: {
            offset: 19,
            mask: [0x7F]
        }
    };
    control[control_id.delay_feedback] = { // 27,
        name: "delay feedback",
        sysex: {
            offset: 20,
            mask: [0x7F]
        }
    };
    control[control_id.bypass] = { // 14,
        name: "bypass",
        map_raw: _2_steps,
        sysex: {
            offset: 21,
            mask: [0x7F]
        }
    };
    control[control_id.envelope_type] = { // 9,
        name: "env type",
        map_raw: _2_steps,
        sysex: {
            offset: 22,
            mask: [0x7F]
        }
    };
    control[control_id.synth_mode] = { // 29,
        name: "synth mode",
        map_raw: _4_steps,
        sysex: {
            offset: 23,
            mask: [0x7F]
        }
    };
    control[control_id.synth_waveshape] = { // 30
        name: "waveshape",
        map_raw: _2_steps,
        sysex: {
            offset: 24,
            mask: [0x7F]
        }
    };
    control[control_id.tap] = { // 28,
        name: "tap" //,
        // sysex: {
        //     offset: 22,
        //     mask: [0x7F]
        // }
    };

// add the missing default properties
    control.forEach(function (obj) {

        obj.cc_number = control.indexOf(obj);   // is also the msb
        obj.cc_type = "cc";

        let bits = 7;

        if (!obj.hasOwnProperty("human")) {
            obj.human = v => v;
        }

        if (!obj.hasOwnProperty("on_off")) {
            obj.on_off = false;
        }

        if (!obj.hasOwnProperty("range")) {
            obj.range = obj.on_off ? [0, 1] : [0, (1 << bits) - 1];
        }

        if (!obj.hasOwnProperty("cc_range")) {
            obj.cc_range = [0, (1 << bits) - 1];
        }

        // pre-computed value that may be useful:
        obj.cc_min = Math.min(...obj.cc_range);
        obj.cc_max = Math.max(...obj.cc_range);
        obj.cc_delta = obj.cc_max - obj.cc_min;

        if (!obj.hasOwnProperty("init_value")) {
            if (obj.hasOwnProperty("cc_center")) {
                // console.log(`cc-${obj.cc_number}: obj.init_value = obj.cc_center: ${obj.init_value}=${obj.cc_center}`);
                obj.init_value = Array.isArray(obj.cc_center) ? obj.cc_center[0] : obj.cc_center;
            } else if ((Math.min(...obj.range) < 0) && (Math.max(...obj.range) > 0)) {
                obj.init_value = (1 << (bits - 1)) - 1; // very simple rule: we take max/2 as default value
            } else {
                obj.init_value = Math.min(...obj.range);
            }
        }

        if (!obj.hasOwnProperty("raw_value")) {
            obj.raw_value = obj.init_value;
        }

        obj.changed = function () {
            return obj.raw_value !== obj.init_value;
        }

    });

} // defineControls()

defineControls();
