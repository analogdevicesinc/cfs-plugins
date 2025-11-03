.. zephyr:code-sample:: hello_world_tflm
   :name: hello_world_tflm
   :relevant-api: gpio_interface

   Run a basic 'hello world' sine prediction TensorFlow Lite model. 

Overview
********

The Hello World sample uses a TensorFlow Lite Micro (TFLM) model to predict the sine value of some
inputs and compares to a calculated value.

The source code shows how to:

#. Initialize a TFLM model
#. Invoke the model
#. Access the outputs of the model

Requirements
************

Console output is via UART. 
No other peripherals are used by this example. 

Building and Running
********************

Build and run via the CodeFusion Studio activity bar or actions panel.
