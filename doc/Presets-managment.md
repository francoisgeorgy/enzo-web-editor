Enzo Editor Presets Management
==============================
             
|    | Operation                             | Editor Preset Selector \(ID\) | Editor preset dirty indicator | Editor values  | Enzo Preset ID | Enzo values                     |
|----|---------------------------------------|-------------------------------|-------------------------------|----------------|----------------|---------------------------------|
|  1 | Editor startup with no Enzo connected | none selected \(0\)           | set clean                     | init           | N/A            | N/A                             |
|  2 | Enzo connected                        | none selected \(0\)           | set clean                     | \-             | \-             | \-                              |
|  3 | Editor startup with Enzo connected    | read from Enzo                | set clean                     | loaded from Enzo | \-           | \-                              |
|  4 | Read Enzo                             | updated from Enzo             | set clean                     | loaded from Enzo | \-           | \-                              |
|  5 | Send to Enzo                          | \-                            | \-                            | \-             | \-             | updated with Editor values      |
|  6 | Select preset in Editor               | updated                       | set clean                     | loaded from Enzo | updated      | updated with Enzo preset values |
|  7 | Modify control in Editor              | \-                            | set dirty                     | updated        | \-             | updated by MIDI CC              |
|  8 | Modify control in Enzo                | \-                            | set dirty                     | updated        | \-             | updated by MIDI CC              |
|  9 | Load sysex file                       | \-                            | \-                            | \-             | \-             | \-                              |
| 10 | Select preset in Library              | \-                            | set dirty                     | updated        | \-             | updated by MIDI CC              |
| 11 | Bookmark Preset in the Editor         | \-                            | \-                            | \-             | \-             | \-                              |
| 12 | Save Preset from the Editor           | \-                            | set clean                     | \-             | \-             | saved in Enzo memory            |

TODO: preset from URL

- means "not changed/not affected".

### Editor startup with no Enzo connected: 

If the Enzo is connected _after_ the Editor has been started, then the Editor will not be updated and will not reflect the Enzo current settings. This is by design in order
avoid loosing a preset you may have prepared in the Editor. 

If the Enzo is connected after the Editor has been started and you want the editor to reflects the Enzo settings you have two possibilites:

1. Click the "Read Enzo" command in the Editor.
2. Refresh the browser page. This will restart the Editor and it will automatically read the Enzo. 

### Editor startup with Enzo already connected:

If the Enzo is already connected and the Editor MIDI settings are already setup in the Editor's preferences, then the Editor will automatically
read the Enzo and reflects its settings. 

### Presets Library:

- All preset in the Library have Preset ID set to 0.
- All imported presets from sysex files have their Preset ID set to 0.

This is by design in order to avoid changing the Preset number (ID) when you select a preset in the Library.

To save in Enzo a preset from the Library you have to:

1. Select the Preset Number
2. Select the Preset in the Library
3. Click the SAVE command.



1. Editor startup
    - read Enzo current preset
    - editor Preset Selector == Enzo preset #
    
2. Modify a control in the editor
    - update Enzo
    - show Preset as Dirty (dot in the preset selector)
    - The Preset Selector displays the Dirty Indicator (dot)
    
5. Select a preset from the library
    - Editor is update
    - Enzo is update
    - The current Preset ID (Editor & Enzo) is not changed
    - The Preset Selector displays the Dirty Indicator (dot)    
