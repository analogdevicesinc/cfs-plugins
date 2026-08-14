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

/**
 * @file        main.c
 * @brief       Demonstrates the alarm functionality of the Real-Time Clock (RTC)
 * @details     The RTC is configured to wake the device from backup mode every
 *              TIME_OF_DAY_SEC seconds. On wakeup, the device will print the current
 *              time, rearm the alarm, and return to backup mode.
 */

/***** Includes *****/
#include <stdint.h>
#include <stdio.h>

#include "board.h"
#include "led.h"
#include "lp.h"
#include "mxc_delay.h"
#include "mxc_device.h"
#include "nvic_table.h"
#include "rtc.h"
#include "uart.h"

/***** Definitions *****/
#define LED_TODA 0
#define TIME_OF_DAY_SEC 7

#define MSEC_TO_RSSA(x) \
    (0 - ((x * 4096) /  \
          1000)) // Converts a time in milliseconds to the equivalent RSSA register value.
#define SECS_PER_MIN 60
#define SECS_PER_HR (60 * SECS_PER_MIN)
#define SECS_PER_DAY (24 * SECS_PER_HR)

/***** Globals *****/

/***** Functions *****/
// *****************************************************************************
void RTC_IRQHandler(void) {}

// *****************************************************************************
void rescheduleAlarm(void)
{
    uint32_t time;
    int flags = MXC_RTC_GetFlags();

    if (flags & MXC_RTC_INT_FL_LONG) { // Check for TOD alarm flag
        MXC_RTC_ClearFlags(MXC_RTC_INT_FL_LONG);

        MXC_RTC_GetSeconds(&time); // Get Current time (s)

        while (MXC_RTC_DisableInt(MXC_RTC_INT_EN_LONG) == E_BUSY) {}
        // Disable interrupt while re-arming RTC alarm

        if (MXC_RTC_SetTimeofdayAlarm(time + TIME_OF_DAY_SEC) !=
            E_NO_ERROR) { // Reset TOD alarm for TIME_OF_DAY_SEC in the future
            /* Handle Error */
        }

        while (MXC_RTC_EnableInt(MXC_RTC_INT_EN_LONG) == E_BUSY) {}
        // Re-enable TOD alarm interrupt
    }

    MXC_LP_EnableRTCAlarmWakeup(); // Enable RTC as a wakeup source from low power modes
}

// *****************************************************************************
void printTime(void)
{
    uint32_t day, hr, min, sec;

    MXC_RTC_GetSeconds(&sec); // Get current time

    day = sec / SECS_PER_DAY;
    sec -= day * SECS_PER_DAY;

    hr = sec / SECS_PER_HR;
    sec -= hr * SECS_PER_HR;

    min = sec / SECS_PER_MIN;
    sec -= min * SECS_PER_MIN;

    printf("\nCurrent Time (dd:hh:mm:ss): %02u:%02u:%02u:%02u\n\n", day, hr, min,
           sec); // Print current time
}

// *****************************************************************************
int configureRTC(void)
{
    MXC_Delay(MXC_DELAY_SEC(2)); // Delay to give debugger a window to connect

    printf("\n\n***************** RTC Wake from Backup Example *****************\n\n");
    printf("The time-of-day alarm is set to wake the device every %d seconds.\n", TIME_OF_DAY_SEC);
    printf("When the alarm goes off it will print the current time to the console.\n\n");

    if (MXC_RTC_Init(0, 0) != E_NO_ERROR) { // Initialize RTC
        printf("Failed RTC Initialization\n");
        printf("Example Failed\n");
        while (1) {}
    }

    if (MXC_RTC_Start() != E_NO_ERROR) { // Start RTC
        printf("Failed RTC_Start\n");
        printf("Example Failed\n");
        while (1) {}
    }

    printf("RTC started\n");

    NVIC_DisableIRQ(RTC_IRQn);
    MXC_RTC_DisableInt(MXC_RTC_INT_EN_LONG | // Reset interrupt state
                       MXC_RTC_INT_EN_SHORT | MXC_RTC_INT_EN_READY);
    MXC_RTC_ClearFlags(MXC_RTC_GetFlags());
    NVIC_EnableIRQ(RTC_IRQn);

    if (MXC_RTC_SetTimeofdayAlarm(TIME_OF_DAY_SEC) != E_NO_ERROR) { // Arm TOD alarm
        printf("Failed RTC_SetTimeofdayAlarm\n");
        printf("Example Failed\n");
        while (1) {}
    }

    if (MXC_RTC_EnableInt(MXC_RTC_INT_EN_LONG) == E_BUSY) { // Enable TOD interrupt
        return E_BUSY;
    }

    if (MXC_RTC_Start() != E_NO_ERROR) { // Re-start RTC
        printf("Failed RTC_Start\n");
        printf("Example Failed\n");
        while (1) {}
    }

    return E_NO_ERROR;
}

// *****************************************************************************
int main(void)
{
    if (!(MXC_PWRSEQ->lppwst & MXC_F_PWRSEQ_LPPWST_BACKUP)) {
        // Did not wake from backup mode --> start RTC
        if (configureRTC() != E_NO_ERROR) {
            printf("Example Failed\n");
            while (1) {}
        }
    } else {
        // Woke up from backup mode --> Reset backup status and print time
        MXC_PWRSEQ->lppwst |= MXC_F_PWRSEQ_LPPWST_BACKUP;

        LED_On(LED_TODA); // RTC alarm fired off. Perform periodic task here
        printTime();
    }

    rescheduleAlarm(); // Re-arm RTC TOD alarm

    MXC_Delay(MXC_DELAY_SEC(1));
    LED_Off(LED_TODA);

    while (MXC_UART_ReadyForSleep(MXC_UART_GET_UART(CONSOLE_UART)) != E_NO_ERROR) {}

    MXC_LP_EnterBackupMode(); // Enter a backup mode
}
