.. zephyr:code-sample:: lvgl
   :name: LVGL basic sample
   :relevant-api: display_interface input_interface

   Display a "Hello World" and react to user input using LVGL.

Overview
********

This sample application displays "Hello World" in the center of the screen
and a counter at the bottom which increments every second.
The sample supports a button-based input mechanism (sw0):

* Button (sw0)
      When the `sw0` GPIO alias is present and `CONFIG_RESET_COUNTER_SW0` is enabled,
      pressing the button resets the counter value.

Building and Running
********************

Press **Pristine Build** and then **Flash** directly in the CodeFusion Studio (CFS) tool.

References
**********

* `LVGL Web Page <https://lvgl.io/>`_
