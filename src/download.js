import MODEL from "./model";
// import {log} from "./debug";
// import {toHexString} from "./utils";

export function downloadLastSysEx() {

    let data = MODEL.getSysEx();   // return Uint8Array

    // log("downloadLastSysEx", data, toHexString(data, ' '));
    // log("downloadLastSysEx", encodeURIComponent(data));

    const now = new Date();
    const timestamp =
        now.getUTCFullYear() + "-" +
        ("0" + (now.getUTCMonth()+1)).slice(-2) + "-" +
        ("0" + now.getUTCDate()).slice(-2) + "-" +
        ("0" + now.getUTCHours()).slice(-2) + "" +
        ("0" + now.getUTCMinutes()).slice(-2) + "" +
        ("0" + now.getUTCSeconds()).slice(-2);

    const preset_num = MODEL.meta.preset_id.value;

    let shadowlink = document.createElement('a');
    shadowlink.style.display = 'none';
    shadowlink.download = `enzo-preset${preset_num ? '-' : ''}${preset_num ? preset_num : ''}.${timestamp}.syx`;

    const blob = new Blob([data], {type: "application/octet-stream"});
    const url = window.URL.createObjectURL(blob);
    shadowlink.href = url;

    document.body.appendChild(shadowlink);
    shadowlink.click();
    document.body.removeChild(shadowlink);
    setTimeout(function() {
        return window.URL.revokeObjectURL(url);
    }, 1000);

    return false;   // disable the normal href behavior
}