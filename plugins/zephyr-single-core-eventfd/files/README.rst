.. zephyr:code-sample:: posix-eventfd
   :name: eventfd()

   Use ``eventfd()`` to create a file descriptor for event notification.

Overview
********

This sample application demonstrates using the POSIX eventfd() function to create a file descriptor,
which can be used for event notification. The returned file descriptor is used with write/read calls
and write/read values are output to the console.

Building and Running
********************

This sample can be built and run in two ways, and outputs to the console in both cases.

**Option 1: CodeFusion Studio (CFS)**

Press **Pristine Build**, then **Flash** in CodeFusion Studio (CFS).


**Option 2: POSIX-compliant host OS (for example, Linux)**

To build directly for a POSIX-compliant host OS:

.. code-block:: console

   cd m4
   make -f Makefile.host

The output binary is generated in ``m4/build``. To run the sample from the ``m4`` directory:

.. code-block:: console

   build/eventfd

**Note:** The project directory depends on the selected SoC. Use m4, m33, or m4-0 as appropriate.
If your target maps to m33 or m4-0, replace m4 in the commands accordingly.

Sample Output
=============

.. code-block:: console

    Writing 1 to efd
    Writing 2 to efd
    Writing 3 to efd
    Writing 4 to efd
    Completed write loop
    About to read
    Read 10 (0xa) from efd
    Finished
