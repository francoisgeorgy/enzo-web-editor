# Enzo sysex format

    0000000: f0 00 20 10 00 01 03 26 01 06 7b 7f 21 7b 39 00  .. ....&..{.!{9.
    0000010: 54 7f 00 66 00 7f 00 7f 00 7f 40 7b 7f 21 7b 39  T..f......@{.!{9
    0000020: 00 54 7f 00 66 00 f7                             .T..f..
    
    
    f0              start marker
    00 20 10        manufacturer ID
    00 01 03 26     constant accross all presets
    01              preset number
    06              pitch 
    7b              filter 
    7f              mix
    21              sustain 
    7b              filter env 
    39              modulation 
    00              portamento
    54              filter type 
    7f              delay level 
    00              ring mod
    66              filter bw
    00              delay feedback 
    7f              bypass
    00              env type
    7f              synth mode  
    00              waveshape 
    7f 40 7b        ? 
    7f 21 7b 39     ?
    00 54 7f 00     ?
    66 00           ?
    f7              end marker   

 
pitch: offset: 9, mask: [0x7F]
filter: offset: 10,  mask: [0x7F]
mix: offset: 11, mask: [0x7F]
sustain: offset: 12, mask: [0x7F]
filter env: offset: 13, mask: [0x7F]
modulation: offset: 14, mask: [0x7F]
portamento: offset: 15, mask: [0x7F]
filter type: offset: 16, mask: [0x7F]
delay level: offset: 17, mask: [0x7F]
ring mod: offset: 18, mask: [0x7F]
filter bandwidth: offset: 19, mask: [0x7F]
delay feedback: offset: 20, mask: [0x7F]
bypass: offset: 21, mask: [0x7F]
env type: offset: 22, mask: [0x7F]
synth mode: offset: 23, mask: [0x7F]
waveshape: offset: 24, mask: [0x7F]


