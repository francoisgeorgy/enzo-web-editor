
export const KNOB_THEME_DEFAULT = {

    label: false,
    value_min: 0,
    value_max: 127,
    value_resolution: 1,
    default_value: 0,
    center_zero: false,
    center_value: 0,
    format: v => v,
    snap_to_steps: false,
    mouse_wheel_acceleration: 1,

    bg_radius: 40,
    bg_border_width: 1,

    cursor_radius: 24,
    cursor_length: 14,
    cursor_width: 6,
    cursor_color_init: "#f8f812",
    cursor_color: "#f8f812",

    track: true,
    track_color_init: "#f8f812",
    track_color: "#f8f812",
    track_radius: 36,
    track_width: 5,
    class_track : "knob-track",

    track_bg: false,

    bg:  true,
    cursor: true,
    linecap: "round",
    value_text: true,
    value_position: 58,    // empirical value: HALF_HEIGHT + config.font_size / 3
    font_family: "sans-serif",
    font_size: 25,
    font_weight: "bold",
    markers: false,

    class_bg: "knob-bg",
    class_value : "knob-value",
    class_cursor : "knob-cursor",
    class_markers: "knob-markers",

    markers_color: "#3680A4",
    font_color: "#fff"
};
