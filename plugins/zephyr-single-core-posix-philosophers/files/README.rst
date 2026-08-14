.. zephyr:code-sample:: posix-philosophers
   :name: POSIX Philosophers

   Implement a solution to the Dining Philosophers problem using the POSIX API.

Overview
********

This sample implements Zephyr's :zephyr:code-sample:`dining-philosophers` sample using the
:ref:`POSIX API <posix_support>`. The source code for this sample can be found under
:file:`samples/posix/philosophers`.

Building and Running
********************

Press **Pristine Build** and then **Flash** directly in the CodeFusion Studio (CFS) tool.

This project outputs to the console.

Sample Output
=============

.. code-block:: console

   Philosopher 0 [P: 3]  HOLDING ONE FORK
   Philosopher 1 [P: 2]  HOLDING ONE FORK
   Philosopher 2 [P: 1]  EATING  [ 1900 ms ]
   Philosopher 3 [P: 0]  THINKING [ 2500 ms ]
   Philosopher 4 [C:-1]  THINKING [ 2200 ms ]
   Philosopher 5 [C:-2]  THINKING [ 1700 ms ]

Debugging
*********

Like the original philosophers sample, the POSIX variant also enables
:kconfig:option:`CONFIG_DEBUG_THREAD_INFO` by default, allowing thread information to be
inspected during a debug session.

CodeFusion Studio (CFS) provides preconfigured debug launch configurations for supported debug
probes. To start a debug session:

1. Open the **Run and Debug** view.

2. Select an appropriate debug configuration from the configuration drop-down menu. Available
   options depend on the target board and configured debug probe.

3. Click **Start Debugging** or press **F5**.

Additional Information
**********************

For additional information, please refer to the :zephyr:code-sample:`dining-philosophers` sample.
