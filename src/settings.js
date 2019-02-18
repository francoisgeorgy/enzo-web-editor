import store from "storejs";

export let settings = {
    midi_channel: "all",
    input_device_id: null,    // web midi port ID
    output_device_id: null    // web midi port ID
};

export function loadSettings() {
    const s = store.get("enzo.settings");
    if (s) settings = JSON.parse(s);
}

export function saveSettings(options = {}) {
    Object.assign(settings, settings, options);
    store("enzo.settings", JSON.stringify(settings));
}
