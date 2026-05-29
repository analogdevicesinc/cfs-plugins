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

Building and Running
********************

The code for this sample can be found in :zephyr_file:`samples/drivers/i2c/custom_target`.

To build and flash the application:

- Press **Pristine Build**
- Then press **Flash** directly in the CFS Tool

Hardware Notes
**************

This sample requires external pull-up resistors on the SCL and SDA lines for the
I2C bus to operate correctly in target mode.

On several ADI MAX series development boards, dedicated jumpers are available to
provide the required pull-up resistors directly on the board. However, on boards
that do not include these jumpers, external pull-up resistors must be added to
both the SCL and SDA lines.

If the pull-ups are missing, the target driver will fail to initialize and the
application will report an error similar to the following::

    i2c custom target sample
    Failed to register target