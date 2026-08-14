.. zephyr:code-sample:: helloworld_user
   :name: Hello World

   Print a simple "Hello World" from userspace.

Overview
********
A simple Hello World example that can be used with any supported board and
prints 'Hello World from UserSpace!' to the console.
If unavailable or unconfigured then 'Hello World from privileged mode.'
is printed instead.

Building and Running
********************

Press **Pristine Build** and then **Flash** directly in the CodeFusion Studio (CFS) tool.

Sample Output
=============

This project outputs 'Hello World from UserSpace!' to the console.
The console printout will look similar to the following:

.. code-block:: console

    Hello World from UserSpace! (max32690evkit)

