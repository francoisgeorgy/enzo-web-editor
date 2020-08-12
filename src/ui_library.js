import {log, warn} from "./debug";

export function setupLibrary() {
    // warn("setupLibrary: TODO: v1.5");

    $('#library-toggle').click(() => {
        // log('#library-toggle click');
        const library = $("#library");
        const label = $("#library-toggle-label");
        if (library.is(".closed")) {
            library.removeClass("closed");
            label.text("Close library");
        } else {
            library.addClass("closed");
            label.text("Open library");
        }
        return false;
    });

}
