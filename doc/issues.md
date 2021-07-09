
## Questions

To send a SysEx one need to hold the ALT LED for 2-3 seconds before pressing the Bypass LED. Does that means that the Enzo first _save_ the preset before sending it as SysEx?

For the secondary functions, there a 0.5 sec delay before the second parameter begins to change. 

Example with MODULATION:
    
    $ receivemidi cc syx dev "mi.1 Bluetooth" ts
    22:20:10.143   channel  2   control-change    21  21        <-- move MODULATION non-stop...
    22:20:10.211   channel  2   control-change    21  25
    22:20:10.278   channel  2   control-change    21  28
    22:20:10.357   channel  2   control-change    21  31
    22:20:10.424   channel  2   control-change    21  34
    22:20:10.492   channel  2   control-change    21  37
    22:20:10.559   channel  2   control-change    21  40
    22:20:10.627   channel  2   control-change    21  43
    22:20:10.705   channel  2   control-change    21  47
    22:20:10.784   channel  2   control-change    21  50
    22:20:10.841   channel  2   control-change    21  53
    22:20:10.908   channel  2   control-change    28 127        <-- press ALT
    22:20:10.908   channel  2   control-change    21  56
    22:20:10.987   channel  2   control-change    21  58
    22:20:11.054   channel  2   control-change    21  60
    22:20:11.122   channel  2   control-change    21  62
    22:20:11.189   channel  2   control-change    21  65
    22:20:11.268   channel  2   control-change    21  67
    22:20:11.336   channel  2   control-change    21  69
    22:20:11.403   channel  2   control-change    21  71
    22:20:11.470   channel  2   control-change    27  73        <-- ALT value begin to change after about 0.5 sec.
    22:20:11.550   channel  2   control-change    27  75
    22:20:11.617   channel  2   control-change    27  77
    22:20:11.684   channel  2   control-change    27  79
    22:20:11.752   channel  2   control-change    27  81
    22:20:11.820   channel  2   control-change    27  83    

    
Example with MIX:

    $ receivemidi cc syx dev "mi.1 Bluetooth" ts
    22:21:36.351   channel  2   control-change    18   9        <-- start moving MIX
    22:21:36.418   channel  2   control-change    18  10
    22:21:36.486   channel  2   control-change    18  11
    22:21:36.564   channel  2   control-change    18  13
    22:21:36.632   channel  2   control-change    18  16
    22:21:36.699   channel  2   control-change    18  17
    22:21:36.767   channel  2   control-change    18  19
    22:21:36.846   channel  2   control-change    18  21
    22:21:36.924   channel  2   control-change    18  22
    22:21:36.980   channel  2   control-change    18  23
    22:21:37.048   channel  2   control-change    18  24
    22:21:37.127   channel  2   control-change    18  26
    22:21:37.194   channel  2   control-change    18  27
    22:21:37.262   channel  2   control-change    18  28
    22:21:37.329   channel  2   control-change    18  29
    22:21:37.476   channel  2   control-change    18  30
    22:21:37.554   channel  2   control-change    18  31
    22:21:37.588   channel  2   control-change    28 127        <-- press ALT
    22:21:37.622   channel  2   control-change    18  33
    22:21:37.678   channel  2   control-change    18  34
    22:21:37.757   channel  2   control-change    18  35
    22:21:37.824   channel  2   control-change    18  37
    22:21:37.892   channel  2   control-change    18  38
    22:21:37.960   channel  2   control-change    18  40
    22:21:38.038   channel  2   control-change    18  41
    22:21:38.105   channel  2   control-change    24  42        <-- MIX secondary function appears after 0.5 sec.
    22:21:38.173   channel  2   control-change    24  43
    22:21:38.241   channel  2   control-change    24  45
    22:21:38.308   channel  2   control-change    24  46
    22:21:38.387   channel  2   control-change    24  48
    22:21:38.454   channel  2   control-change    24  49
    22:21:38.522   channel  2   control-change    24  50    
    
## Problems

Sometimes. Enzo sends CC for Modulation when changing synth mode. Usually when modulation is set around value 85. 

    $ receivemidi cc dev "mi.1 Bluetooth"
    channel  2   control-change    29   0
    channel  2   control-change    21  86
    channel  2   control-change    21  87
    
    channel  2   control-change    29   0
    channel  2   control-change    21  83
    channel  2   control-change    21  84    
    
    