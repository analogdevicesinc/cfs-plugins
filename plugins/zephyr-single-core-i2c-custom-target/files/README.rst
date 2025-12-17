.. zephyr:code-sample:: i2c-custom-target
   :name: I2C Custom Target
   :relevant-api: i2c_interface

   Setup a custom I2C target on the I2C interface.

Overview
********

This sample demonstrates how to setup an I2C custom target on the I2C interface
using the :ref:`i2c-target-api`.

Requirements
************

This sample requires an I2C peripheral which is capable of acting as a target.

This sample has been tested on :zephyr:board:`MAX32690 EVKIT`.

Building and Running
********************

The code for this sample can be found in :zephyr_file:`samples/drivers/i2c/custom_target`.

To build and flash the application:

Press Pristine Build and then Flash directly in the CFS Tool.