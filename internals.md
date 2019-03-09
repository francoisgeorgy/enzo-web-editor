
TODO: describe how the application works.

USER ACTION:

    knob onChange:
        ui:handleUserAction
            updateDevice
                MODEL.setControlValue
                sendCC
                if exp: 
                    interpolate
                    updateControls
                        updateControl that have two_values=true

MIDI IN:

    handleCC
        updateModelAndUI
            MODEL.setControlValue
            updateControl
