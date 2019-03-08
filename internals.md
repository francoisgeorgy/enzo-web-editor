
TODO: describe how the application works.

USER ACTION:

    knob onChange:
        handleUserAction
            updateDevice
                sendCC
                if exp: 
                    interpolate
                    updateControls

MIDI IN:

    handleCC
        updateModelAndUI
            MODEL.setControlValue
            updateControl
