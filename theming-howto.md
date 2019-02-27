
## CSS

### default theme

    html {
        --color1: #4b3f00;
        --color2: #030201;
        ...
    }

    html #wrapper {
        background: ...;
    }

### another theme:    

    html[data-theme="my-theme"] {
        --color1: #cc6fa1;
        --color2: #9ab4cf;
        ...
    }
    
    html[data-theme="gold"] #wrapper {
        background: ...;
    }
    

## HTML

    document.documentElement.setAttribute('data-theme', "my-theme");
    
    
