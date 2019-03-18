
TODO: describe how the application works.

USER ACTION:

    knob onChange:
        ui:handleUserAction
            if PC:
                sendPC
            if CC:
                if not EXP:
                    setPresetDirty
                updateDevice
                    MODEL.setControlValue
                    sendCC
                    if exp: 
                        interpolate
                        updateControls
                            updateControl that have two_values=true

MIDI OUT:

    fullUpdateDevice
        sendSysex
        
MIDI IN:

    handleSysex
        MODEL.setValuesFromSysEx
            decodeSysEx
                decodeMeta
                    set meta.preset_id.value
                decodeControls
                decodeGlobals
        if SYSEX_PRESET:
            resetExp
            updateUI            
                updatePresetSelector
                    setPresetClean
                        add .sel if pc>0
                        add .on if communication ok
                updateControls
        if SYSEX_GLOBALS:
            updateGlobalSettings

    handleCC
        updateModelAndUI
            MODEL.setControlValue
            updateControl
            if EXP
                interpolateExpValues
                updateControls
            setPresetDirty

MIDI DEVICE:

    on connected:
        deviceConnected
            port is input:
                connectInputDevice
                    disconnectInputPort
                        remove listeners
                        updatePresetSelector
                    connectInputPort
                        setMidiInputPort
                        updatePresetSelector
                    syncIfNoPreset
                        if preset === 0
                            requestPreset
                        else
                            setPresetDirty                            
            port is output:
                connectOutputDevice
                    disconnectOutputPort
                    connectOutputPort
                    syncIfNoPreset
                        if preset === 0
                            requestPreset
                        else
                            setPresetDirty                            
            updateSelectDeviceList
            if hash:
                initFromBookmark
                    resetExp
                    updateUI
                        updatePresetSelector
                            setPresetClean
                                add .sel if pc>0
                                add .on if communication ok
                        updateControls
                        
    on disconnected:
        deviceDisconnected
        port is input:
            disconnectInputPort
                remove listeners
                updatePresetSelector
        port is output:
            disconnectOutputPort
                updatePresetSelector
        updateSelectDeviceList            
