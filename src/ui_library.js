
export function setupLibrary() {

    $('#library-toggle').click(() => {
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
