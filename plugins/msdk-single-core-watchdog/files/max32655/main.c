/******************************************************************************
 *
 * Copyright (C) 2022-2023 Maxim Integrated Products, Inc. (now owned by 
 * Analog Devices, Inc.),
 * Copyright (C) 2023-2026 Analog Devices, Inc.
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

/*
 * @file    main.c
 * @brief   Demonstrates a watchdog timer in run mode
 *
 * @details When the program starts LED1 blinks three times and stops.
 *          Then LED0 start blinking continuously.
 *          Open a terminal program to see interrupt messages.
 *
 *          OVERFLOW button: Triggers WDT overflow test
 *
 *          UNDERFLOW button: Triggers WDT underflow test
 */

/***** Includes *****/
#include <stdio.h>
#include <stdint.h>
#include "mxc_device.h"
#include "nvic_table.h"
#include "board.h"
#include "mxc_sys.h"
#include "wdt.h"
#include "mxc_delay.h"
#include "led.h"
#include "pb.h"

/***** Definitions *****/

/*
* Refers to pushbutton array indices.
*
* Button mapping per board:
*
* MAX32655EVKIT:
*   PB[0] = SW3 -> OVERFLOW test
*   PB[1] = SW4 -> UNDERFLOW test
*
* MAX32655FTHR:
*   PB[0] = SW2 -> OVERFLOW test
*   PB[1] = SW3 -> UNDERFLOW test
*/
#define OVERFLOW_BTN    0
#define UNDERFLOW_BTN   1

/***** Globals *****/

/***** Functions *****/

// *****************************************************************************
void WatchdogHandler(void)
{
    MXC_WDT_ClearIntFlag(MXC_WDT0);
    printf("\nTIMEOUT! \n");
}

// *****************************************************************************
void WDT0_IRQHandler(void)
{
    WatchdogHandler();
}

// *****************************************************************************
void MXC_WDT_Setup(void)
{
    MXC_WDT_Disable(MXC_WDT0);
    MXC_WDT_ResetTimer(MXC_WDT0);
    MXC_WDT_Enable(MXC_WDT0);
}

// *****************************************************************************
void SW_Callback(void)
{
    MXC_WDT_Disable(MXC_WDT0);
    MXC_NVIC_SetVector(WDT0_IRQn, WDT0_IRQHandler);
    NVIC_EnableIRQ(WDT0_IRQn);
    MXC_WDT_Enable(MXC_WDT0);
}

// *****************************************************************************
void BlinkLed(int led, int num_of_blink, unsigned int ms_delay)
{
    for (int i = 0; i < num_of_blink; i++) {
        LED_On(led);
        MXC_Delay(MXC_DELAY_MSEC(ms_delay));
        LED_Off(led);
        MXC_Delay(MXC_DELAY_MSEC(ms_delay));
    }
}

// *****************************************************************************
int main(void)
{
    if (MXC_WDT_GetResetFlag(MXC_WDT0)) {
        uint32_t resetFlags = MXC_WDT_GetResetFlag(MXC_WDT0);

        if (resetFlags == MXC_F_WDT_CTRL_RST_LATE) {
            printf("\nWatchdog Reset occurred too late (OVERFLOW)\n");
        } else if (resetFlags == MXC_F_WDT_CTRL_RST_EARLY) {
            printf("\nWatchdog Reset occurred too soon (UNDERFLOW)\n");
        }

        MXC_WDT_ClearResetFlag(MXC_WDT0);
        MXC_WDT_ClearIntFlag(MXC_WDT0);
    }

    printf("\n************** Watchdog Timer Demo ****************\n");
    printf("Watchdog timer is configured in Windowed mode. You can\n");
    printf("select between two tests: Timer Overflow and Underflow.\n");
    printf("\nPress a button to create watchdog interrupt and reset:\n");
    printf("Push OVERFLOW button = timeout and reset program\n");
    printf("Push UNDERFLOW button = reset program\n\n");

    //blink LED1 three times at startup
    BlinkLed(1, 3, 100);

    //Setup watchdog
    MXC_WDT_Setup();

    while (1) {
        // Press OVERFLOW button to trigger overflow test
        if (PB_Get(OVERFLOW_BTN) == TRUE) {
            printf("\nEnabling Timeout Interrupt...\n");
            SW_Callback();

            while (1) {}

        }

        // Press UNDERFLOW button to trigger underflow test
        if (PB_Get(UNDERFLOW_BTN) == TRUE) {
            printf("\nSetting Reset Period...\n");
            SW_Callback();
            MXC_Delay(MXC_DELAY_MSEC(200));
            MXC_WDT_ResetTimer(MXC_WDT0);
        }

        //blink LED0
        BlinkLed(0, 1, 500);

        //Reset watchdog
        MXC_WDT_ResetTimer(MXC_WDT0);
    }
}