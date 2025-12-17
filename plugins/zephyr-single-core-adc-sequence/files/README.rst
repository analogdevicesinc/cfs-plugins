.. zephyr:code-sample:: adc_sequence
   :name: Analog-to-Digital Converter (ADC) sequence sample
   :relevant-api: adc_interface

   Read analog inputs from ADC channels, using a sequence.

Overview
********

This sample demonstrates how to use the :ref:`ADC driver API <adc_api>` using sequences.

Depending on the target board, it reads ADC samples from two channels
and prints the readings on the console, based on the sequence specifications.
Notice how for the whole sequence reading, only one call to the :c:func:`adc_read` API is made.
If voltage of the used reference can be obtained, the raw readings are converted to millivolts.

This example constructs an adc device and setups its channels, according to the
given devicetree configuration.

Building and Running
********************

Make sure that the ADC is enabled (``status = "okay";``) and has each channel as a
child node, with your desired settings like gain, reference, or acquisition time and
oversampling setting (if used). See :zephyr_file:`boards/max32690evkit_max32690_m4.overlay and
boards/channel_adc_max32.overlay` for an example of such setup.

Building and Running
========================================

Press **Pristine Build** and then **Flash** directly in the CodeFusion Studio (CFS) tool.

Sample output
=============

You should get a similar output as below, repeated every second:

.. code-block:: console

   ADC sequence reading [1]:
   - ADC_0, channel 0, 5 sequence samples:
   - - 36 = 65mV
   - - 35 = 63mV
   - - 36 = 65mV
   - - 35 = 63mV
   - - 36 = 65mV
   - ADC_0, channel 1, 5 sequence samples:
   - - 0 = 0mV
   - - 0 = 0mV
   - - 1 = 1mV
   - - 0 = 0mV
   - - 1 = 1mV

.. note:: If the ADC is not supported, the output will be an error message.
