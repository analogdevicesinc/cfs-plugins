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
#include <zephyr/drivers/mbox.h>

/* Message describing what the ISR received, drained by the main thread. */
struct ipc_event {
	bool has_payload;
	uint32_t led_state;
};

/* Decouples the mbox ISR from the (blocking) printf in thread context. */
K_MSGQ_DEFINE(ipc_msgq, sizeof(struct ipc_event), 8, 4);

static void mbox_callback(const struct device *dev, mbox_channel_id_t channel_id,
			   void *user_data, struct mbox_msg *data)
{
	/* Keep the ISR minimal: capture the event and defer all I/O to a thread. */
	struct ipc_event evt = {0};

	if (data && data->data) {
		evt.has_payload = true;
		evt.led_state = *(uint32_t *)data->data;
	}

	/* Non-blocking put is ISR-safe; drop the event if the queue is full. */
	(void)k_msgq_put(&ipc_msgq, &evt, K_NO_WAIT);
}

int main(void)
{
	/* RV32 core is started automatically by soc_early_init_hook()
	 * when CONFIG_MAX32_SECONDARY_RV32=y is set.
	 */

	k_msleep(5); // 5ms delay for zephyr to print UART status message

	const struct device *mbox_dev = DEVICE_DT_GET(DT_NODELABEL(mbox));
	int ret;

	if (!device_is_ready(mbox_dev)) {
		printf("M4: MBOX device not ready\n");
		return -ENODEV;
	}

	ret = mbox_register_callback(mbox_dev, 0, mbox_callback, NULL);
	if (ret < 0) {
		printf("M4: mbox_register_callback failed: %d\n", ret);
		return ret;
	}

	ret = mbox_set_enabled(mbox_dev, 0, true);
	if (ret < 0) {
		printf("M4: mbox_set_enabled failed: %d\n", ret);
		return ret;
	}

	printf("M4: waiting for IPC messages from RV32...\n");

	struct ipc_event evt;

	while (k_msgq_get(&ipc_msgq, &evt, K_FOREVER) == 0) {
		if (evt.has_payload) {
			printf("M4: received LED state from RV32: %s\n",
			       evt.led_state ? "ON" : "OFF");
		} else {
			printf("M4: received signal from RV32 (no payload)\n");
		}
	}

	return 0;
}
