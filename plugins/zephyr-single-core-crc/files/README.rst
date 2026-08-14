.. zephyr:code-sample:: crc_subsys
   :name: Cyclic Redundancy Check Subsystem (CRC Subsys)

   Compute and verify a CRC computation using the CRC subsys API.

Overview
********

This sample demonstrates how to use the Cyclic Redundancy Check Subsystem.

Configuration Options
*********************

This sample uses the following Kconfig options:

- ``CONFIG_CRC``: Enable CRC functionality.
- Other CRC-related Kconfig options control which algorithms are enabled and whether hardware acceleration is used (when available).
  These options can be modified in the project's ``prj.conf`` file or passed via CMake arguments.

Building and Running
********************

Press **Pristine Build** and then **Flash** directly in the CodeFusion Studio (CFS) tool.

Sample Output
=============

.. code-block:: console

   subsys_crc_example: Result of CRC32 IEEE: 0xCEA4A6C2
   subsys_crc_example: Result of CRC8 CCITT: 0x96
   subsys_crc_example: CRC computation completed successfully

.. note::
   If the board does not support a hardware CRC driver, the computation will fall
   back to a software-based implementation.

Expected Behavior
*****************

When the sample runs, it should:

1. Compute the CRC32 and CRC8 values of predefined data.
2. Print the computed CRC values.
