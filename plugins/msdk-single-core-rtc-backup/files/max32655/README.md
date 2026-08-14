## Description

This example demonstrates the use of the Real Time Clock (RTC) and its alarm functionality.

The RTC time-of-day alarm is used to wake the device from backup mode every TIME\_OF\_DAY\_SEC seconds (defined at the top of main.c). When the device wakes up, it will print the current time of the RTC to the terminal window and return to backup mode while waiting for the next time-of-day alarm to fire.

> **Note:** This example continuously enters BACKUP mode and wakes up via the RTC alarm. Erase/program operations may occasionally fail while the example is running. If the application behaves unexpectedly after reprogramming, power-cycle the board and program the application again.

## Software

### Project Usage

Universal instructions on building, flashing, and debugging this project can be found in the **[MSDK User Guide](https://analogdevicesinc.github.io/msdk/USERGUIDE/)**.

### Project-Specific Build Notes

* This project comes pre-configured for the MAX32655EVKIT.  See [Board Support Packages](https://analogdevicesinc.github.io/msdk/USERGUIDE/#board-support-packages) in the MSDK User Guide for instructions on changing the target board.

## Required Connections

If using the MAX32655EVKIT (EvKit\_V1):
-   Connect a USB cable between the PC and the CN1 (USB/PWR) connector.
-   Connect pins JP4(RX_SEL) and JP5(TX_SEL) to RX0 and TX0  header.
-   Open a terminal application on the PC and connect to the EV kit's console UART at 115200, 8-N-1.
-   Close jumper JP2 (LED0 EN).
-   Close jumper JP3 (LED1 EN).

If using the MAX32655FTHR (FTHR\_Apps\_P1):
-   Connect a USB cable between the PC and the J4 (USB/PWR) connector.
-   Open a terminal application on the PC and connect to the board's console UART at 115200, 8-N-1.

## Expected Output

```
***************** RTC Wake from Backup Example *****************

The time-of-day alarm is set to wake the device every 7 seconds.
When the alarm goes off it will print the current time to the console.

RTC started
RTC Trimmed to 32768 Hz
MXC_TRIMSIR->rtc = 0x1ef0000

Current Time (dd:hh:mm:ss): 00:00:00:07


Current Time (dd:hh:mm:ss): 00:00:00:14


Current Time (dd:hh:mm:ss): 00:00:00:21

...
```


