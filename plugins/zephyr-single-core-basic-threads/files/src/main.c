/*
 * Copyright (c) 2017 Linaro Limited
 * Portions Copyright (c) 2026 Analog Devices, Inc.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

#include <zephyr/kernel.h>
#include <zephyr/device.h>
#include <zephyr/drivers/gpio.h>
#include <zephyr/sys/printk.h>
#include <zephyr/sys/__assert.h>
#include <string.h>

/* size of stack area used by each thread */
#define STACKSIZE 1024U

/* scheduling priority used by each thread */
#define PRIORITY 7U

#define LED0_NODE DT_ALIAS(led0)
#define LED1_NODE DT_ALIAS(led1)

#if !DT_NODE_HAS_STATUS_OKAY(LED0_NODE)
#error "Unsupported board: led0 devicetree alias is not defined"
#endif

#if !DT_NODE_HAS_STATUS_OKAY(LED1_NODE)
#error "Unsupported board: led1 devicetree alias is not defined"
#endif

struct printk_data_t {
	void *fifo_reserved; /* 1st word reserved for use by fifo */
	uint32_t led;
	uint32_t cnt;
};

K_FIFO_DEFINE(printk_fifo);

struct led {
	struct gpio_dt_spec spec;
	uint8_t num;
};

static const struct led led0 = {
	.spec = GPIO_DT_SPEC_GET_OR(LED0_NODE, gpios, {0}),
	.num = 0,
};

static const struct led led1 = {
	.spec = GPIO_DT_SPEC_GET_OR(LED1_NODE, gpios, {0}),
	.num = 1,
};

/* Thread stacks */
K_THREAD_STACK_DEFINE(blink0_stack, STACKSIZE);
K_THREAD_STACK_DEFINE(blink1_stack, STACKSIZE);
K_THREAD_STACK_DEFINE(uart_out_stack, STACKSIZE);
 
/* Thread control blocks */
static struct k_thread blink0_thread;
static struct k_thread blink1_thread;
static struct k_thread uart_out_thread;

/* Thread IDs */
static k_tid_t blink0_tid;
static k_tid_t blink1_tid;
static k_tid_t uart_out_tid;

void blink(const struct led *led, uint32_t sleep_ms, uint32_t id)
{
	const struct gpio_dt_spec *spec = &led->spec;
	int cnt = 0;
	int ret;

	if (!device_is_ready(spec->port)) {
		printk("Error: %s device is not ready\n", spec->port->name);
		return;
	}

	ret = gpio_pin_configure_dt(spec, GPIO_OUTPUT);
	if (ret != 0) {
		printk("Error %d: failed to configure pin %d (LED '%d')\n",
			ret, spec->pin, led->num);
		return;
	}

	while (1) {
		gpio_pin_set(spec->port, spec->pin, cnt % 2U);

		struct printk_data_t tx_data = { .led = id, .cnt = cnt };

		size_t size = sizeof(struct printk_data_t);
		char *mem_ptr = k_malloc(size);
		__ASSERT_NO_MSG(mem_ptr != NULL);

		memcpy(mem_ptr, &tx_data, size);

		k_fifo_put(&printk_fifo, mem_ptr);

		k_msleep(sleep_ms);
		cnt++;
	}
}

void blink0(void *a, void *b, void *c)
{
	ARG_UNUSED(a);
	ARG_UNUSED(b);
	ARG_UNUSED(c);

	blink(&led0, 200U, 0U);
}

void blink1(void *a, void *b, void *c)
{
	ARG_UNUSED(a);
	ARG_UNUSED(b);
	ARG_UNUSED(c);

	blink(&led1, 1000U, 1U);
}

void uart_out(void *a, void *b, void *c)
{
	ARG_UNUSED(a);
	ARG_UNUSED(b);
	ARG_UNUSED(c);

	while (1) {
		struct printk_data_t *rx_data = k_fifo_get(&printk_fifo,
							   K_FOREVER);
		printk("Toggled led%u; counter=%u\n",
		       rx_data->led, rx_data->cnt);
		k_free(rx_data);
	}
}

int main(void)
{
	printk("Thread example start\n");
 
	blink0_tid = k_thread_create(&blink0_thread,
					blink0_stack,
					K_THREAD_STACK_SIZEOF(blink0_stack),
					blink0,
					NULL, NULL, NULL,
					PRIORITY, 0, K_NO_WAIT);
	k_thread_name_set(blink0_tid, "blink0");

	blink1_tid = k_thread_create(&blink1_thread,
					blink1_stack,
					K_THREAD_STACK_SIZEOF(blink1_stack),
					blink1,
					NULL, NULL, NULL,
					PRIORITY, 0, K_NO_WAIT);
	k_thread_name_set(blink1_tid, "blink1");

	uart_out_tid = k_thread_create(&uart_out_thread,
					uart_out_stack,
					K_THREAD_STACK_SIZEOF(uart_out_stack),
					uart_out,
					NULL, NULL, NULL,
					PRIORITY, 0, K_NO_WAIT);
	k_thread_name_set(uart_out_tid, "uart_out");

	while (1) {
		k_sleep(K_FOREVER);
	}
}
