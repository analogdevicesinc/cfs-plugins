.. zephyr:code-sample:: watchdog
   :name: Watchdog
   :relevant-api: watchdog_interface

   Use the watchdog driver API to reset the board when it gets stuck in an infinite loop.

Overview
********

This sample demonstrates how to use the watchdog driver API.

A typical use case for a watchdog is that the board is restarted in case some piece of code
is kept in an infinite loop.

Building and Running
********************

In this sample, a watchdog callback is used to handle a timeout event once. This functionality is used to request an action before the board
restarts due to a timeout event in the watchdog driver.

The watchdog peripheral is configured in the board's ``.dts`` file. Make sure that the watchdog is enabled
using the configuration file in ``boards`` folder.
Example overlay (if needed):

.. code-block:: dts

   &wdt0 {
       status = "okay";
   };

Building and Running
=========================================

Press Pristine Build and then Flash directly in the CFS Tool.

Open a terminal application on the PC and connect to the board's console UART at 115200, 8-N-1.

Sample output
=============

You should get a similar output as below:

.. code-block:: console

   Watchdog sample application
   Attempting to test pre-reset callback
   Feeding watchdog 5 times
   Feeding watchdog...
   Feeding watchdog...
   Feeding watchdog...
   Feeding watchdog...
   Feeding watchdog...
   Waiting for reset...
   Handled things..ready to reset

.. note:: After the last message, the board will reset and the sequence will start again
