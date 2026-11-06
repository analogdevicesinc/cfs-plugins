/*
 * Copyright (c) 2026 Analog Devices, Inc.
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
 */

#ifdef ENABLE_TFLM_PROFILING

#include <xtensa/tie/xt_timer.h>

#include "tensorflow/lite/micro/micro_time.h"

// CCOUNT counts core clock cycles. Same default and override macro as the
// toolchain's <sharc/cycle_count_21xxx.h>, so cycle-to-time conversions stay
// consistent with the rest of the project.
#ifndef __PROCESSOR_SPEED__
#define __PROCESSOR_SPEED__ 1000000000 /* 1 GHz */
#endif

// The TFLM package ships no SHARC-FX implementation of these, so its reference
// version reports 0 for every profiled event. Defining them in a project object
// file keeps the linker from pulling micro_time.o out of libtflm.a.
namespace tflite {

uint32_t ticks_per_second() { return __PROCESSOR_SPEED__; }

uint32_t GetCurrentTimeTicks() { return XT_RSR_CCOUNT(); }

}  // namespace tflite

#endif  // ENABLE_TFLM_PROFILING
