.. zephyr:code-sample:: multi-thread-blinky
   :name: Basic thread manipulation
   :relevant-api: gpio_interface thread_apis
 
   Spawn multiple threads that blink LEDs and print information to the console.
 
Overview
********
 
This example demonstrates creating multiple threads at runtime using
:c:func:`k_thread_create`. The threads are created in :c:func:`main` and
started immediately.
 
The application creates three threads:
 
- ``blink0`` controls ``led0`` and toggles it every 200 ms
- ``blink1`` controls ``led1`` and toggles it every 1000 ms
- ``uart_out`` reads data from a FIFO and prints information to the console
 
When either LED thread toggles its LED, it pushes a data structure into a
:ref:`FIFO <fifos_v2>` containing:
 
- the LED/thread identifier
- the number of times the LED has toggled
 
The ``uart_out`` thread retrieves this information from the FIFO and prints it
using :c:func:`printk`.
 
All threads are assigned names using :c:func:`k_thread_name_set`, which helps
with debugging and thread analysis tools.
 
Requirements
************
 
The board must have two LEDs connected via GPIO pins. These are called "User
LEDs" on many of Zephyr's :ref:`boards`. The LEDs must be configured using the
``led0`` and ``led1`` :ref:`devicetree <dt-guide>` aliases, usually in the
:ref:`BOARD.dts file <devicetree-in-out-files>`.
 
You will see one of these errors if you try to build this sample for an
unsupported board:
 
.. code-block:: none
 
   Unsupported board: led0 devicetree alias is not defined
   Unsupported board: led1 devicetree alias is not defined
 
Building
********

Press Pristine Build and then Flash directly in the CFS Tool.

Sample Output
*************
 
The console output will look similar to:
 
.. code-block:: none
 
   Thread example start
   Toggled led0; counter=0
   Toggled led1; counter=0
   Toggled led0; counter=1
   Toggled led0; counter=2
   Toggled led0; counter=3
   Toggled led0; counter=4
