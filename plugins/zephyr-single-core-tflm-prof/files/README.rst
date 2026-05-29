.. zephyr:code-sample:: tflm_profiling
   :name: tflm_profiling
   :relevant-api: gpio_interface

   Profile a TensorFlow Lite model using Zephelin. 

Overview
********

The example runs sample inferences on a model and captures the trace of the
inferences using the Zephelin profiling tool.
The number of inferences is determined by the size of the dataset where:
num inferences = dataset size % input size.
The output is not checked. 

The trace information is transmitted in an encoded CTF format over UART. 
Follow the steps below to run and visualize the inferences. 

Note: as the UART is used to transmit an encoded stream, standard console output
cannot be used via the same UART. This example has no console output. 

Requirements
************

Trace output (CTF) is via UART. 
No other peripherals are used by this example. 

Building and Running
********************

Build via the CodeFusion Studio activity bar or actions panel.
Before running, start the trace capture by invoking the "Capture profiler trace (Zephelin) (m4)" action.

After the application has completed, stop capture by (TBD).
Then the convert the trace by invoking the "Prepare CTF trace for visualization (Zephelin) (m4)" action.

The visualization can then be loaded by (TBD).

