import DEVICE from "./enzo/enzo.js";
import * as Utils from "./lib/utils.js";
import * as Mustache from "mustache";
import {hexy} from "hexy";
import LZString from "lz-string";
import "./css/print.css";

const URL_PARAM_SYSEX = "sysex";    // name of sysex parameter in the query-string

function renderControlName(control_number) {
    const c = DEVICE.control[control_number];
    return c.name;
}

function renderControlValue(control_number) {
    const c = DEVICE.control[control_number];
    return c.human(c.raw_value);
}

function renderPreset(template) {

    // $("#preset-number").text(DEVICE.meta.getStringValue(DEVICE.meta.preset_id.value));

    const t = $(template).filter("#template-main").html();
    const p = {
        "n": function () {
            return function (text) {
                return renderControlName(text.trim().toLowerCase());
            }
        },
        "v": function () {
            return function (text) {
                return renderControlValue(text.trim().toLowerCase());
            }
        }
    };

    $("body").append(Mustache.render(t, p));

    $("#print").click(function(){
        window.print();
        return false;
    });
}

function loadTemplate(data) {
    $.get("templates/preset-template.html", function(template) {
        let d = null;
        if (data) {
            for (let i=0; i<data.length; i++) {
                if (data[i] === 240) {
                    if (d) {
                        if (DEVICE.setValuesFromSysEx(d)) {
                            renderPreset(template);
                        } else {
                            console.warn("unable to update device from sysex");
                        }
                    }
                    d = [];
                }
                d.push(data[i]);
            }
        }
        if (d) {
            if (DEVICE.setValuesFromSysEx(d)) {
                renderPreset(template);
            } else {
                console.warn("unable to update device from sysex");
            }
        }
        renderPreset(template);
    });
}

function loadErrorTemplate(data) {

    $.get("templates/preset-template.html", function(template) {

        const t = $(template).filter("#template-error").html();

        $("body").append(Mustache.render(t, {dump: data ? hexy(Array.from(data), {format:"twos"}) : "no data"}));

        $("#cmds").text("");

        $("#print").click(function(){
            window.print();
            return false;
        });

    });
}

$(function () {

    DEVICE.init();

    let valid = false;
    let data = null;
    const s = Utils.getParameterByName(URL_PARAM_SYSEX);
    if (s) {
        try {
            data = Utils.fromHexString(LZString.decompressFromBase64(decodeURI(s)));
            valid = DEVICE.setValuesFromSysEx(data);
        } catch (error) {
            console.warn(error);
        }
    }

    if (valid) {
        loadTemplate(null);
    } else {
        loadErrorTemplate(data);
    }

});
