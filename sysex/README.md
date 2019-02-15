# Enzo sysex format

## Summary

Ref: https://www.midi.org/specifications/item/table-1-summary-of-midi-message

A MIDI System Exclusive message has the following format:

`N` is the number of bytes of bytes of the messages.

| Offset | Data   | BS-II | Description                            |
| ------:| ------:| -----:|:-------------------------------------- |
|      0 |     F0 |       | Mark the start of the SysEx message    | 
|      1 |   _id_ |  0x00 | Manufacturer's ID                      |
|      2 |   _id_ |  0x20 | Manufacturer's ID                      |
|      3 |   _id_ |  0x29 | Manufacturer's ID                      |
| 4.._N_-2 | _xx_ |       | data (N-5 bytes)                 |
|    _N_-1 |   F7 |       | Mark the end of the SysEx message      |

Note: "Japanese Group" manufacturers have only one ID byte. See [https://www.midi.org/specifications/item/manufacturer-id-numbers] for more details.


## SysEx data sent by the Enzo

- **Offset**: index from the start of the SysEx data. First byte (0xF0) has offset=0.
- **Bytes**: number of bytes to consider for this parameter
- **Mask**: mask to apply to the above bytes to get the bits relative to the parameter
- **Bits**: how many bits form the value


| Offset | Bytes | Hex mask   | Bin mask            | Bits | Description |
| ------:| -----:| :--------- | :------------------ | ----:| ----------- |
|      1 |     3 | `7F 7F 7F` | `01111111 01111111 01111111` | 3x 8 | Manufacturer ID |
|      8 |     1 | `7F`       | `01111111         ` |    7 | Patch number |
|      9 |     1 | `7F`       | `01111111`          |    7 | Pitch (CC 16) |
|     10 |     1 | `7F`       | `01111111`          |    7 | Filter (CC 17) |
|     11 |     1 | `7F`       | `01111111`          |    7 | Mix (CC 18) |
|     12 |     1 | `7F`       | `01111111`          |    7 | Sustain (CC 19) |
|     13 |     1 | `7F`       | `01111111`          |    7 | Filter envelope (CC 20) |
|     14 |     1 | `7F`       | `01111111`          |    7 | Modulation (CC 21) |
|     15 |     1 | `7F`       | `01111111`          |    7 | Portamento (CC 22) |
|     16 |     1 | `7F`       | `01111111`          |    7 | Filter type (CC 23) |
|     17 |     1 | `7F`       | `01111111`          |    7 | Delay level (CC 24) |
|     18 |     1 | `7F`       | `01111111`          |    7 | Ring modulation (CC 25) |
|     19 |     1 | `7F`       | `01111111`          |    7 | Filter bandwidth (CC 26) |
|     20 |     1 | `7F`       | `01111111`          |    7 | Delay feedback (CC 27) |
|     21 |     1 | `7F`       | `01111111`          |    7 | Bypass (CC 14) |
|     22 |     1 | `7F`       | `01111111`          |    7 | Envelope type (CC 9) |
|     23 |     1 | `7F`       | `01111111`          |    7 | Synth mode (CC 29) |
|     24 |     1 | `7F`       | `01111111`          |    7 | Waveshape (CC 30) |
