/* Copyright 2023 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/

// Simplified version of hello world example from
// https://github.com/tensorflow/tflite-micro/tree/main/tensorflow/lite/micro/examples/hello_world

// Needed for sin() and fabsf()
#include <math.h>

// Standard TfLM includes 
#pragma GCC diagnostic push
// TFLM library mixes float/double literals which produces warnings
#pragma GCC diagnostic ignored "-Wdouble-promotion"
#include "tensorflow/lite/core/c/common.h"
#include "tensorflow/lite/micro/micro_interpreter.h"
#include "tensorflow/lite/micro/micro_log.h"
#include "tensorflow/lite/micro/micro_mutable_op_resolver.h"
#include "tensorflow/lite/micro/micro_profiler.h"
#include "tensorflow/lite/micro/recording_micro_interpreter.h"
#include "tensorflow/lite/micro/system_setup.h"
#include "tensorflow/lite/schema/schema_generated.h"
#pragma GCC diagnostic pop

// ADI Generated model header
#include "hello_world_model_f32.hpp"

// Zephelin profiler includes
extern "C" {

#ifdef CONFIG_ZPL
#include <zpl.h>
#endif

#ifdef CONFIG_ZPL_INFERENCE_PROFILING
#include <zpl/inference_event.h>
#endif

}

#ifdef CONFIG_ZPL_TFLM_PROFILER
#include <zpl/tflm_profiler.hpp>
static zpl::TFLMProfiler* p_profiler = new zpl::TFLMProfiler();
#endif

int RunFloat32Model() {
  const tflite::Model* model = ::tflite::GetModel(hello_world_model_f32);
  TFLITE_CHECK_EQ(model->version(), TFLITE_SCHEMA_VERSION);

  // Call op resolver function provided by ADI generated file to avoid
  // having to identify which operators are used by the model. 
  tflite::MicroMutableOpResolver<HELLO_WORLD_MODEL_F32_NUM_OPERATORS> op_resolver;
  TF_LITE_ENSURE_STATUS(adi_resolve_ops_hello_world_model_f32(op_resolver));

  // Arena size just a round number. The exact arena usage can be determined
  // using the RecordingMicroInterpreter.
  constexpr int kTensorArenaSize = 3000;

  // Using alignas(16) as recommended by tflite-micro documentation:
  // https://github.com/zephyrproject-rtos/tflite-micro/blob/8d404de73acf7687831e16d88e86e4f73cfddf8e/tensorflow/lite/micro/micro_allocator.h#L133
  alignas(16) uint8_t tensor_arena[kTensorArenaSize];

#ifdef CONFIG_ZPL_TFLM_PROFILER
  tflite::MicroAllocator *p_allocator = tflite::MicroAllocator::Create(tensor_arena, kTensorArenaSize);
  tflite::MicroInterpreter interpreter(model, op_resolver, p_allocator, nullptr, p_profiler);
#else
  tflite::MicroInterpreter interpreter(model, op_resolver, tensor_arena,
                                       kTensorArenaSize);
#endif

#ifdef CONFIG_ZPL_TFLM_PROFILER
  p_profiler->SetInterpreter(&interpreter);
  p_profiler->SetAllocator(p_allocator);
#endif

  TF_LITE_ENSURE_STATUS(interpreter.AllocateTensors());

  // Check if the predicted output is within a small range of the
  // expected output
  float epsilon = 0.05f;
  constexpr int kNumTestValues = 4;
  float golden_inputs[kNumTestValues] = {0.f, 1.f, 3.f, 5.f};
  bool pass = 0;
  int fails = 0;

  for (int i = 0; i < kNumTestValues; ++i) {
    interpreter.input(0)->data.f[0] = golden_inputs[i];
#ifdef CONFIG_ZPL_INFERENCE_PROFILING
	  zpl_inference_enter();
#endif
    TF_LITE_ENSURE_STATUS(interpreter.Invoke());
#ifdef CONFIG_ZPL_INFERENCE_PROFILING
	  zpl_inference_exit();
#endif
#ifdef CONFIG_ZPL_TFLM_PROFILER
    p_profiler->DumpEvents();
#endif
    float y_pred = interpreter.output(0)->data.f[0];
    float y_calc = sin(golden_inputs[i]);
    pass = fabsf(y_calc - y_pred) < epsilon;
    if (!pass)
      fails++;
    MicroPrintf("Test %d %s: pred=%f calc=%f", i, pass ? "passed" : "failed", (double)y_pred, (double)y_calc);
  }

  return fails;
}

int main() {
  int fails = 0;
#ifdef CONFIG_ZPL
  zpl_init();
#endif
  tflite::InitializeTarget();
  fails += RunFloat32Model();
  MicroPrintf("Done - %s\n", fails ? "Failures" : "Success");
  return 0;
}
