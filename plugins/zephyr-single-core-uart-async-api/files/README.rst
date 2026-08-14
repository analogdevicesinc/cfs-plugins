.. zephyr:code-sample:: uart_async
   :name: UART ASYNC API
   :relevant-api: uart_interface

   Demonstrate the use of the asynchronous API

Overview
********

This sample demonstrates how to use the UART serial driver asynchronous
API through a simple packet transmitter.

Every 5 seconds, 1 to 4 data payloads are generated and queued for
transmission. Every other 5 second period, receiving is enabled through
the asynchronous API.

By default, the UART peripheral that is normally used for the Zephyr shell
is used, so that almost every board should be supported.

Users can send the string "hello." through the UART console. After the
board receives the string, it is printed back to the console,
demonstrating asynchronous UART reception.

Building and Running
********************

Press **Pristine Build**, then **Flash** directly in the CodeFusion Studio (CFS)
tool to build and program the application.

Sample Output
*************

.. code-block:: console

   Loop 0: Packet: 0
   Loop 0: Packet: 1
   Loop 0: Packet: 2
   [00:00:05.001,919] <inf> sample: Loop 0: Sending 3 packets
   [00:00:05.002,008] <inf> sample: RX is now enabled
   Loop 1: Packet: 0
   [00:00:10.002,086] <inf> sample: Loop 1: Sending 1 packets
   [00:00:10.002,138] <inf> sample: RX is now disabled
   Loop 2: Packet: 0
   Loop 2: Packet: 1
   [00:00:15.002,215] <inf> sample: Loop 2: Sending 2 packets
   [00:00:15.002,293] <inf> sample: RX is now enabled
   [00:00:15.009,010] <inf> sample: RX_RDY
                                 68 65 6c 6c 6f 0a                                |hello.
   Loop 3: Packet: 0
   Loop 3: Packet: 1
   Loop 3: Packet: 2
   [00:00:20.002,343] <inf> sample: Loop 3: Sending 3 packets
   [00:00:20.002,424] <inf> sample: RX is now disabled

Note that because the UART transmissions are triggered directly, they will
appear in the serial logs **before** the ``LOG_INF`` message at the top of
the loop, since log writes are typically deferred by several seconds.
