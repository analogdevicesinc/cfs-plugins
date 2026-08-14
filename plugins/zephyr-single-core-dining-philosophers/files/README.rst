.. zephyr:code-sample:: dining-philosophers
  :name: Dining Philosophers
  :relevant-api: semaphore_apis mutex_apis stack_apis thread_apis fifo_apis lifo_apis

  Implement a solution to the Dining Philosophers problem using Zephyr kernel services.

Overview
********

An implementation of a solution to the Dining Philosophers problem (a classic multi-thread
synchronization problem). This particular implementation demonstrates the usage of multiple
preemptible and cooperative threads of differing priorities, as well as dynamic mutexes and thread
sleeping.

The philosopher always tries to get the lowest fork first (f1 then f2). When done, he will give
back the forks in the reverse order (f2 then f1). If he gets two forks, he is ``EATING``.
Otherwise, he is ``THINKING``. Transitional states are shown as well, such as ``STARVING`` when the
philosopher is hungry but the forks are not available, and ``HOLDING ONE FORK`` when a philosopher
is waiting for the second fork to be available.

Each philosopher will randomly alternate between the ``EATING`` and ``THINKING`` states.

It is possible to run the demo in ``coop-only`` or ``preempt-only`` mode. To achieve this, set
these values for ``CONFIG_NUM_COOP_PRIORITIES`` and ``CONFIG_NUM_PREEMPT_PRIORITIES`` in
:file:`prj.conf`:

preempt-only
  .. code-block:: cfg

     CONFIG_NUM_PREEMPT_PRIORITIES=6
     CONFIG_NUM_COOP_PRIORITIES=0


coop-only
  .. code-block:: cfg

     CONFIG_NUM_PREEMPT_PRIORITIES=0
     CONFIG_NUM_COOP_PRIORITIES=6

In these cases, the philosopher threads will run with priorities 0 to 5 (preempt-only) and -7 to -2
(coop-only).

Building and Running
********************

Press **Pristine Build** and then **Flash** directly in the CodeFusion Studio (CFS) tool.

Sample Output
=============

.. code-block::

   Philosopher 0 [P: 3]  HOLDING ONE FORK
   Philosopher 1 [P: 2]  HOLDING ONE FORK
   Philosopher 2 [P: 1]  EATING  [ 1900 ms ]
   Philosopher 3 [P: 0]  THINKING [ 2500 ms ]
   Philosopher 4 [C:-1]  THINKING [ 2200 ms ]
   Philosopher 5 [C:-2]  THINKING [ 1700 ms ]


Debugging
*********

This sample enables :kconfig:option:`CONFIG_DEBUG_THREAD_INFO`, allowing thread information to be
inspected during a debug session.

CodeFusion Studio (CFS) provides preconfigured debug launch configurations for supported debug
probes. To start a debug session:

1. Open the **Run and Debug** view.

2. Select an appropriate debug configuration from the configuration drop-down menu. Available
   options depend on the target board and configured debug probe.

3. Click **Start Debugging** or press **F5**.

While debugging, the **XRTOS** view can be used to inspect the philosopher threads. The view
displays useful runtime information including:

* Thread name
* Thread state
* Thread priority
* Stack usage
* Stack peak usage

This sample creates multiple philosopher threads with different priorities, making it useful for
observing thread scheduling, synchronization, and resource contention behavior during execution.
