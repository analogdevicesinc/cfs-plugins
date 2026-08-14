# Flash Example

## Description

This example demonstrates the usage of the Flash Controller (FLC) for general purpose storage. The following use-cases are demonstrated:

1. Reading bytes from a specific location in Flash
2. Writing and verifying a test pattern into Flash
3. Modifying Flash contents

Flash is **non-volatile** memory, meaning that it can retain state through power cycles. However, application code is stored in Flash and the FLC has some limitations in how it can perform writes, so there are a few minor challenges to deal with when using it for general purpose storage. This example demonstrates a simplified use-case that covers the most common scenarios.

The _first_ time the example is run the application will use the FLC to write and verify a test pattern into the last page of flash. It will also write a 32-bit "magic" sequence into the page.

Once complete, the example will prompt the user to reset or power cycle the board. This is to demonstrate that the written data is non-volatile and can survive a power cycle.

The _second_ time the example is run the application will see the "magic" 32-bit sequence in flash. When this happens, the application will verify that the test pattern has survived the power cycle first. Then, it will _modify_ the "magic" sequence _without_ modifying the rest of the test pattern.

## Software

### Project Usage

Universal instructions on building, flashing, and debugging this project can be found in the **[MSDK User Guide](https://analogdevicesinc.github.io/msdk/USERGUIDE/)**.

### Project-Specific Build Notes

(None - this project builds as a standard example)

## Required Connections

Connect a MAXPICO or other supported Debug adapter to the SWD Connector.

- Note: Debug adapters other than the MAXPICO may not route the UART signals to the SWD connector. On MAX32690FTHR and AD-APARD32690-SL boards, this may limit your ability to access the serial port.

If using the MAX32690EVKIT:

- Connect a USB cable between the PC and the CN2 (USB/PWR - UART) connector.
- Install JP7(RX_EN) and JP8(TX_EN) headers.
- Open a terminal application on the PC and connect to the EV kit's console UART at 115200, 8-N-1.
- Close jumper JP5 (LED0 EN).
- Close jumper JP6 (LED1 EN).

If using the MAX32690FTHR:

- Connect a USB cable between the PC and the J5 (USB/PWR) connector.
- Open a terminal application on the PC and connect to the board's console UART at 115200, 8-N-1.

If using the AD-APARD32690-SL:

- Connect a USB cable between the PC and the P10 (USB-C) connector.
- Open a terminal application on the PC and connect to the MAXPICO's console UART at 115200, 8-N-1.

## Expected Output

After flashing and launching the example, an LED on the board will blink once every second. This is the application waiting for any user button to be pressed (except reset button), and gives a window for a serial terminal to be connected. After connecting the serial terminal, the application will output the following contents:

```
***** Flash Control Example *****
Press any user push button (except reset button) to continue...

---(Critical)---
Erasing page of flash at 0x102FC000...
Writing magic value 0xfeedbeef to address 0x102FC000...
Done!
Writing test pattern...
Done!
----------------
 -> Interrupt! (Flash operation done)


Now reset or power cycle the board...

```

At this point, the "magic" and test pattern values have been written to flash. Press reset button to reset the board, after which the application will restart. Push user button to continue the application again, which will print out the following contents:

```
***** Flash Control Example *****
Press any user push button (except reset button) to continue...

** Magic value 0xfeedbeef found at address 0x102FC000! **

(Flash modifications have survived a reset and/or power cycle.)

Verifying test pattern...
Successfully verified test pattern!

---(Critical)---
Buffering page...
Erasing page...
Erasing magic in buffer...
Re-writing from buffer...
New magic value: 0xabcd1234
----------------
 -> Interrupt! (Flash operation done)

Verifying test pattern...
Successfully verified test pattern!

Flash example successfully completed.

```
