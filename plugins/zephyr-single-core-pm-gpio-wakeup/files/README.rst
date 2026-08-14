.. _max32-pm-gpio_wakeup-sample:

ADI MAX32 PM GPIO WAKEUP
########################

Overview
********

This sample demonstrates using GPIO to wake up the system from low power states on MAX32 SoCs.
It configures a button as a wakeup source and then enters each of the supported PM states
in turn. The user can verify that the system can wake up from each state by pressing the button.
A power profiling tool can be used to verify that the system is entering the expected low power
states and consuming less power while in those states.

Requirements
************

The board should support power management and have a GPIO that can be used as a wakeup source.
The button used in this sample is defined by the ``sw0`` alias in the board's devicetree,
so the board should have that alias defined and pointing to a GPIO pin connected to a button.

PM configurations
*****************

By default, ``CONFIG_PM``, ``CONFIG_PM_DEVICE`` and ``CONFIG_PM_DEVICE_RUNTIME`` are enabled.

Deferred logging is disabled in this sample to ensure that the system does not schedule
deferred work which could wake the system up while it is in a low power state.

Sample Output
*************

The MAX32657/8 declares four CPU power states (``runtime-idle``, ``standby``,
``suspend-to-ram`` and ``soft-off``), but ``soft-off`` is disabled
by default. The sample therefore steps through the three enabled states:
``RUNTIME_IDLE``, ``STANDBY`` and ``SUSPEND_TO_RAM``.

Example output on the MAX32657 EVKIT:

.. code-block:: console

   *** Booting Zephyr OS build g429df005b7bb ***
   Button gpio@8000 pin 12
   Device ready: max32657evkit


   Press the user button to wakeup device from deepsleep mode:
   Entering PM state RUNTIME_IDLE
   Entering PM state STANDBY
   Entering PM state SUSPEND_TO_RAM
   Entering PM state RUNTIME_IDLE
   Entering PM state STANDBY
   Entering PM state SUSPEND_TO_RAM
   Entering PM state RUNTIME_IDLE
   Entering PM state STANDBY
   Entering PM state SUSPEND_TO_RAM
