/**
 *
 * Copyright (c) 2026 Analog Devices, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

#include <errno.h>
#include <stdio.h>
#include <zephyr/kernel.h>
#include <zephyr/drivers/gpio.h>
#include <zephyr/drivers/mbox.h>

/* 1000 msec = 1 sec */
#define SLEEP_TIME_MS   1000

/* The devicetree node identifier for the "led0" alias. */
#define LED0_NODE DT_ALIAS(led0)

static const struct gpio_dt_spec led = GPIO_DT_SPEC_GET(LED0_NODE, gpios);

int main(void)
{
	int ret;
	bool led_state = true;

	/* Set up MBOX for sending LED state to M4 */
	const struct device *mbox_dev = DEVICE_DT_GET(DT_NODELABEL(mbox));

	if (!device_is_ready(mbox_dev)) {
		printf("MBOX device not ready\n");
		return -ENODEV;
	}

	if (!gpio_is_ready_dt(&led)) {
		return -ENODEV;
	}

	ret = gpio_pin_configure_dt(&led, GPIO_OUTPUT_ACTIVE);
	if (ret < 0) {
		return ret;
	}

	printf("RV32: starting LED blink + IPC sender\n");

	k_msleep(10); // 10ms delay before sending a first message to m4

	while (1) {
		ret = gpio_pin_toggle_dt(&led);
		if (ret < 0) {
			return ret;
		}

		led_state = !led_state;

		/* Send LED state to M4 core */
		uint32_t payload = (uint32_t)led_state;
		struct mbox_msg msg = { .data = &payload, .size = sizeof(payload) };

		ret = mbox_send(mbox_dev, 0, &msg);
		if (ret < 0) {
			printf("RV32: mbox_send failed: %d\n", ret);
		}

		k_msleep(SLEEP_TIME_MS);
	}
	return 0;
}
