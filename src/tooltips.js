export function setupTooltips() {

    $('#menu-toggle-tooltip').click(() => {
        const e = $('#menu-toggle-tooltip');
        if (e.is('.inactive')) {
            e.removeClass('inactive');
        } else {
            e.addClass('inactive');
        }
    })

    $('.menu-entry')
        .mouseenter((e) => {
            const c = $(e.currentTarget).children('.tooltip').first();
            console.log(e, c);
            if (tooltipsEnabled() || c.is('.tooltip-always')) c.removeClass('hidden')
        })
        .mouseleave((e) => {
            const c = $(e.currentTarget).children('.tooltip').first();
            if (tooltipsEnabled() || c.is('.tooltip-always')) c.addClass('hidden')
        });

}

export function tooltipsEnabled() {
    return !$('#menu-toggle-tooltip').is('.inactive');
}
