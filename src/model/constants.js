
export const SYNTH_MODES = {
    dry: 0,
    mono: 63,
    arp: 95,
    poly: 127
};

export const WAVESHAPES = {
    sawtooth: 0,
    square: 127
};

export const MODEL_ID = {
    ottobitjr: 0,
    mercury7: 1,
    polymoon: 2,
    enzo: 3
};

export const GROUP_ID = {
    pedal: 1
};

export const SYSEX_CMD = {
    preset_request: 0x25,
    preset_response: 0x26,      // TO BE CONFIRMED
    globals_request: 0x27,
    globals_response: 0x28,     // TO BE CONFIRMED
    patch_write: 0x29
};
