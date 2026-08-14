## Description

Basic GPIO input, output, and interrupts are demonstrated in this example.

### MAX32672EVKIT (EvKit_V1):

An interrupt is set up to trigger when the button (SW3, P0.18) is pressed. When that interrupt occurs LED1 (D2, P0.23) will toggle. Additionally, the button state is constantly being polled, whenever the button is pressed and held LED0 (D2, P0.22) will illuminate.

### MAX32672FTHR (FTHR_RevA):

An interrupt is set up to trigger when the button (SW2, P0.10) is pressed. When that interrupt occurs LED1 (P0.3) will toggle. Additionally, the button state is constantly being polled, whenever the button is pressed and held LED0 (P0.2) will illuminate.

## Software

### Project Usage

Universal instructions on building, flashing, and debugging this project can be found in the **[MSDK User Guide](https://analogdevicesinc.github.io/msdk/USERGUIDE/)**.

### Project-Specific Build Notes

(None - this project builds as a standard example)

## Required Connections

If using the MAX32672EVKIT:

- Connect a USB cable between the PC and the CN1 (USB/PWR) connector.
- Open a terminal application on the PC and connect to the EV kit's console UART at 115200, 8-N-1.
- Select RX0 and TX0 on Headers JP10 and JP11 (UART 0).

If using the MAX32672FTHR:

- Connect a USB cable between the PC and the J4 connector.
- Open a terminal application on the PC and connect to the FTHR's console UART at 115200, 8-N-1.

## Expected Output

The Console UART of the device will output these messages:

```
************************* GPIO Example *************************

This example controls the state of the LEDs based on the state of
the push button P0.18 (SW3). An interrupt is setup so that when
the button is pressed P0.23 (LED1) will toggle. P0.22 (LED0) is set
up to mirror the state of the button; when the button is depressed
LED0 is illuminated and when it is released LED0 is turned off.
```

You will also observe the LED behavior given in the Description section above.
