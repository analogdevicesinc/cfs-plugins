.. zephyr:code-sample:: multi-core-hello-world
   :name: Multi Core Hello World
   :relevant-api: mbox_interface gpio_interface

   Exchange messages between the Arm Cortex-M4 and RISC-V (RV32) cores using MBOX.

Overview
********

This sample demonstrates inter-processor communication (IPC) between the Arm
Cortex-M4 core and the RISC-V (RV32) core using Zephyr's
:ref:`MBOX API <mbox_api>`.

The workspace contains two applications:

- ``m4`` runs on the Arm Cortex-M4 core. It boots first, starts the RV32 core,
  and receives IPC messages.
- ``rv32`` runs on the RISC-V (RV32) core. It blinks the ``led0`` alias and
  reports each LED state change to the M4 over MBOX.

The sample works as follows:

#. The M4 core is the primary core. When ``CONFIG_MAX32_SECONDARY_RV32=y`` is
   set, it automatically starts the RV32 core during early boot
   (``soc_early_init_hook()``), after a delay defined by
   ``CONFIG_MAX32_SECONDARY_RV32_STARTUP_DELAY``.
#. The RV32 core toggles the ``led0`` alias every second and sends the new LED
   state (``ON``/``OFF``) to the M4 through the shared MBOX channel.
#. The M4 core registers an MBOX callback and prints each LED state it receives
   from the RV32 core.

Requirements
************

Your board must have an LED configured using the ``led0`` :ref:`devicetree
<dt-guide>` alias, an ``mbox`` devicetree node, and support for the MAX32
secondary RV32 core.

Supported hardware:

- MAX32655 EV Kit (``EvKit_V1``)
- MAX32690 EV Kit (``EvKit_V1``)
- MAX78002 EV Kit (``EvKit_V1``)

Building and Running
********************

Press Pristine Build and then Flash directly in the CFS Tool for each core
(``m4`` and ``rv32``).

Open a terminal application on the PC and connect to the board's console UART at 115200, 8-N-1.

Sample output
=============

.. code-block:: console

   M4: waiting for IPC messages from RV32...
   RV32: starting LED blink + IPC sender
   M4: received LED state from RV32: OFF
   M4: received LED state from RV32: ON
   M4: received LED state from RV32: OFF

The on-board LED (``led0``) blinks once per second.
