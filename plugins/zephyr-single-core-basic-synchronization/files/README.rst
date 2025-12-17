.. zephyr:code-sample:: synchronization
   :name: Basic Synchronization
   :relevant-api: thread_apis semaphore_apis

   Manipulate basic kernel synchronization primitives.

Overview
********

A simple application that demonstrates basic sanity of the kernel.
Two threads (A and B) take turns printing a greeting message to the console,
and use sleep requests and semaphores to control the rate at which messages
are generated. This demonstrates that kernel scheduling, communication,
and timing are operating correctly.

Building and Running
********************

Press **Pristine Build** and then **Flash** directly in the CodeFusion Studio (CFS) tool.

Sample Output
=============

.. code-block:: console

  thread_a: Hello World from cpu 0 on max32690evkit!
  thread_b: Hello World from cpu 0 on max32690evkit!
  thread_a: Hello World from cpu 0 on max32690evkit!
  thread_b: Hello World from cpu 0 on max32690evkit!
  thread_a: Hello World from cpu 0 on max32690evkit!
  thread_b: Hello World from cpu 0 on max32690evkit!

Exit QEMU by pressing :kbd:`CTRL+A` :kbd:`x`.
