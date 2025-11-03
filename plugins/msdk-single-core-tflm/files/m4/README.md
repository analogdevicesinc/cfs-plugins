## Description

The Hello World sample uses a TensorFlow Lite Micro (TFLM) model to predict the sine value of some
inputs and compares to a calculated value.

The source code shows how to:

#. Initialize a TFLM model
#. Invoke the model
#. Access the outputs of the model


## Software

### Project Usage

Universal instructions on building, flashing, and debugging this project can be found in the **[MSDK User Guide](https://analogdevicesinc.github.io/msdk/USERGUIDE/)**.

### Project-Specific Build Notes

(None - this project builds as a standard example)

## Required Connections

Connect a MAXPICO or other supported Debug adapter to the SWD Connector.
-   Note: Debug adapters other than the MAXPICO may not route the UART signals to the SWD connector. On MAX32690FTHR and AD-APARD32690-SL boards, this may limit your ability to access to serial port.

If using the MAX32690EVKIT:
-   Connect a USB cable between the PC and the CN2 (USB/PWR - UART) connector.
-   Install JP7(RX_EN) and JP8(TX_EN) headers.
-   Open a terminal application on the PC and connect to the EV kit's console UART at 115200, 8-N-1.

If using the MAX32690FTHR:
-   Connect a USB cable between the PC and the J5 (USB/PWR) connector.
-   Open a terminal application on the PC and connect to the EV kit's console UART at 115200, 8-N-1.

If using the AD-APARD32690-SL:
-   Connect a USB cable between the PC and the P10 (USB-C) connector.
-   Open a terminal application on the PC and connect to the MAXPICO's console UART at 115200, 8-N-1.


Console output is via UART. 
No other peripherals are used by this example. 

## Building and Running

Build and run via the CodeFusion Studio activity bar or actions panel.

## Expected Output

The Console UART of the device will output these messages:
