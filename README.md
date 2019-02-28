Enzo web editor
===============

Control your Meris Enzo pedal with your web browser. View all the pedal's settings at once.

--screenshot--


Requirements
============

- This application requires a browser that support the [Web MIDI API](http://webaudio.github.io/web-midi-api/). Currently, only **Chrome** and **Opera** support this standard. This app will therefore _not_ work in Firefox, Safari, IE or Edge. 
- A [Meris MIDI I/O](https://www.meris.us/product/midi-i-o/) interface.
- A MIDI interface in your computer. This can be a homestudio audio interface or, if your computer support Bluetooth, you can use a MIDI bluetooth interface plugged into the Meris MIDI I/O interface. 


Usage
=====

1. Set the Enzo's EXP/MIDI connector for MIDI communication.
2. Set the Enzo's MIDI mode to MIDI OUT. 
3. Set the Enzo's MIDI PORT.
4. Connect the Enzo with the MIDI I/O interface. Use a stereo (TRS) jack cable.
5. Connect the MIDI I/O interface to your computer.
6. Open https://sysex.io/enzo/editor 
7. Allow the browser to access your MIDI devices.
8. In the top-right of the application, select the MIDI input and output devices corresponding to the the MIDI I/O and the MIDI port corresponding to your Enzo MIDI port setting.
9. Move a knob on your Enzo, the corresponding on-screen control must move accordingly. This tests the MIDI IN communication.
10. Play some sound through the Enzo and move a knob on the Editor. The sound should change as if you have moved the same control on the Enzo. This tests the MIDI OUT communication.
11. Enjoy your Enzo!


MIDI (Enzo)
-----------

If you can't get the MIDI communication working, check the following on the Enzo:

- The Global Settings EXP MODE is set to MIDI
- The Global Settings MIDI is set to MIDI OUT
- Choose a Global Settings MIDI CHANNEL.  
- The cable between the Enzo and the MIDI I/O interface is TRS (stereo).
- The MIDI I/O interface is powered on.
- The Enzo is powered on.
- The TSR cable is connected between one of the 4 MIDI I/O jack and the Enzo's EXP/MIDI connecter.
- The MIDI I/O interface is connected to your PC.
- The MIDI application uses the same channel as the Enzo's MIDI channel defined in the Global Settings.

Check the [Meris Enzo User Manual](https://www.meris.us/wp-content/uploads/2018/06/Meris_Enzo_Manual_v1c.pdf) and 
the [Meris MIDI I/O User Manual](https://www.meris.us/wp-content/uploads/2018/03/Meris_MIDI_IO_Full_Manual_v1b.pdf) 
for instructions about how to set the Enzo's Global Settings.


MIDI (browser)
--------------

If you can't get the MIDI communication working, check the following on the browser:

- You use a browser that supports the [Web MIDI](https://www.midi.org/17-the-mma/99-web-midi) API specifications. 
Currently, only the following browsers [support](https://caniuse.com/#feat=midi) the Web MIDI API:

    - Chrome (Mac, Linux, Windows) 
    - Opera (Mac, Linux, Windows)

    Web MIDI is not support under iOS (iPad, iPhone). It may work under Android but I did not test it.

- The Web MIDI is not blocked by your browser. See below for information about this feature in Chrome.

### Web MIDI in Chrome

The first time you access an application that uses the WebMIDI API, the browser will ask you for permission.

--screenshot--

If you refuse access, then the Enzo Editor will display the following message:

    Waiting for MIDI interface access...
    ERROR: WebMidi could not be enabled.
    
You can change the permission at any time:

--screenshots--    
    

Menu: Settings / Advanced / Content settings / MIDI devices    

Menu: Settings / search for "midi" 

    

* Web editor
    * Editor does not show the pedal current config
        * Send a SysEx from the pedal
    * Does not work
        * Check channel
        * Check pedal MIDI config (see above)
        * Select input device
        * Select output device
        * Refresh the browser (F5)
        * Check MIDI is allowed in the browser
* MIDI in Chrome browser
    * Enable / disable
    * Menu:
        * Paramètres 
            * Type MIDI in the search field on top of the page or navigate:
                * Confidentialité et sécurité / Paramètres du contenu / Appareils MIDI
* Output only in left channel
    * Use stereo input 
    * Or set input to MONO
* 


## Bluetooth MIDI

    * On Mac
        * Midi configuration
 


Limitations
===========

This application isn't able to edit the Global configuration of the Enzo.

This application does not offer presets management either.

This application has mainly be tested with Chrome on a MacBook pro running OS X 10.14. Some tests have been done with success with Chrome under Linux Mint 17.1. 
The application has not been thoroughly tested under Windows. Any Windows feedback is very welcome.

Still under active development. Feel free to log bugs/issues. This is a development I'm doing during my freetime. 


# MIDI in your browser

You need to allow your browser to use your MIDI device:

![screenshot](/images/help-01.png "midi settings in Chrome")

In case you didn't allow the use of MIDI device and want to change that, you can right-click on the URL icon and change the setting:
        
![screenshot](/images/help-02.png "midi settings in Chrome")


# FAQ

_To be completed..._


# Contribute

This editor is an Open Source project. You are welcome to contribute.

To contribute your bug fixes, new features, etc.: 1) fork the project, 2) create a pull-request.


# Trademarks

This application is not endorsed by, directly affiliated with, maintained, or sponsored by Meris.             

This application is published under [GNU General Public License v3](https://www.gnu.org/licenses/gpl-3.0.en.html).


