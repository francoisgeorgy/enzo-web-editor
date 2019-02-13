
/**
 * 0..127 to -63..63
 *
 * Note: values 63 and 64 map to 0.
 */
const _63 = function (v) {
    return v < 64 ? (v - 63) : (v - 64);
};

/**
 * 0..127 to -64..63
 */
const _64 = function (v) {
    return v - 64;
};

/**
 * 0..255 to -100..100
 *
 * Note: values 127 and 128 map to 0.
 */
const _100 = function (v) {
    let x = v < 128 ? (v - 127) : (v - 128);
    if (x < -100) {
        x = -100;
    } else if (x > 100) {
        x = 100;
    }
    return x;
};

/**
 * 0..127 to 5..95
 */
const _5_95 = function (v) {
    //console.log(v * 2 * 91.0 / 256 + 5 -0.4);
    // return Math.round(v * 2 * 91.0 / 256 + 5 -0.4);
    let out_max = 95;
    let out_min = 5;
    let in_max = 127;
    let in_min = 0;
    return Math.round(((v - in_min) / (in_max - in_min)) * (out_max - out_min) + out_min - 0.4);
};

export default {
    _5_95,
    _12,
    _63,
    _64,
    _100
}
