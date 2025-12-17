/******************************************************************************
 *
 * Copyright (C) 2022-2023 Maxim Integrated Products, Inc. (now owned by 
 * Analog Devices, Inc.),
 * Copyright (C) 2023-2024 Analog Devices, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 ******************************************************************************/

/**
 * @file        main.c
 * @brief     Example code for scanning the available addresses on an I2C bus
 * @details     This example uses the I2C Controller to found addresses of the I2C Target devices 
 *              connected to the bus. You must set the pull-up jumpers on the line
 *              to the proper I/O voltage.
 */

/***** Includes *****/
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include "mxc_device.h"
#include "mxc_delay.h"
#include "nvic_table.h"
#include "i2c.h"
#include "board.h"

/***** Definitions *****/
#if defined(BOARD_FTHR)
#define I2C_CONTROLLER MXC_I2C2 // SCL P0_19; SDA P0_18
#else
#define I2C_CONTROLLER MXC_I2C0 // SCL P0_6; SDA P0_7
#endif
#define I2C_FREQ 100000 // 100kHZ

// *****************************************************************************
int main(void)
{
    uint8_t counter = 0;

    printf("\n******** I2C TARGET ADDRESS SCANNER *********\n");
    printf("\nThis example finds the addresses of any I2C Target devices connected to the");

#if defined(BOARD_FTHR)
    printf("\nsame bus as I2C2 (SCL - P0.18, SDA - P0.19).\n\n");
#else
    printf("\nsame bus as I2C0 (SCL - P0.6, SDA - P0.7). Enable I2C0 pullup resistors");
    printf("\nby connecting jumpers JP4 and JP5.\n\n");
#endif

    //Setup the I2C controller
    if (E_NO_ERROR != MXC_I2C_Init(I2C_CONTROLLER, 1, 0)) {
        printf("-->Failed controller\n");
        return -1;
    } else {
        printf("\n-->I2C Controller Initialization Complete\n");
    }

    printf("-->Scanning started\n");
    MXC_I2C_SetFrequency(I2C_CONTROLLER, I2C_FREQ);
    mxc_i2c_req_t reqController;
    reqController.i2c = I2C_CONTROLLER;
    reqController.addr = 0;
    reqController.tx_buf = NULL;
    reqController.tx_len = 0;
    reqController.rx_buf = NULL;
    reqController.rx_len = 0;
    reqController.restart = 0;
    reqController.callback = NULL;

    // Loop through valid I2C Target addresses
    for (uint8_t address = 8; address < 120; address++) {
        printf(".");
        fflush(0);

        // Set next Target address
        reqController.addr = address;

        // Do I2C inquiry
        if (E_NO_ERROR == MXC_I2C_MasterTransaction(&reqController)) {
            printf("\nFound target ID %03d; 0x%02X\n", address, address);
            counter++;
        }
        MXC_Delay(MXC_DELAY_MSEC(200));
    }

    printf("\n-->Scan finished. %d devices found\n", counter);
    return 0;
}
