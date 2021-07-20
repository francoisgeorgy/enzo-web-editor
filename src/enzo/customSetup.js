import MODEL from "@model";
import {updateControl} from "@shared/controller";
import {TRACE} from "@shared/utils/debug";
import {setupFootswitches} from "./footswitches";
import {_tempo_bpm, _tempo_ms} from "@model";

export function customSetup() {

    if (TRACE) console.groupCollapsed("customSetupUI");

    setupFootswitches();

    $('#tempo-label').click(() => {
        const c = MODEL.control[MODEL.control_id.tempo];
        if (c.human === _tempo_bpm) {
            c.human = _tempo_ms;
            $('#tempo-label').text('tempo MS');
        } else {
            c.human = _tempo_bpm;
            $('#tempo-label').text('tempo BPM');
        }
        updateControl(c.cc_type, MODEL.control_id.tempo, MODEL.getControlValue(c), MODEL.getMappedControlValue(c));
    });

    if (TRACE) console.groupEnd();
}
