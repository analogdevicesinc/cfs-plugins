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

// Standard headers
#include <string.h>

#include <zephyr/kernel.h>

// ADI Generated model header
#include "adi_tflm.hpp"


void print_model_output(void *output) {
#ifndef CONFIG_ZPL
  int line = 16;
  int i, c;
  unsigned char* cbuf = (unsigned char*)output;
  for(i = 0; i < MODEL_OUTPUT_0_LEN; i++) {
    for(c = 0; c < MODEL_OUTPUT_0_WIDTH; c++) {
      printk("%02x", *cbuf++);
    }
    printk(", ");
    if ((i+1) % line == 0) {
      printk("\n");
    }
  }
  if (MODEL_OUTPUT_0_LEN % line != 0) {
    printk("\n");
  }
#endif
}

#ifndef MODEL_DATASET_LEN
#define NUM_ITERS (10)
// No dataset provided, so generate random values
unsigned char dataset[MODEL_INPUT_0_LEN * MODEL_INPUT_0_WIDTH] = {0};
int iteration = 0;

unsigned char* get_next_dataset_input() {
  for (int i = 0; i < MODEL_INPUT_0_LEN * MODEL_INPUT_0_WIDTH; i++) {
    dataset[i] = rand() % 256;
  }
  if (iteration++ >= NUM_ITERS) {
    return NULL;
  } else {
    return dataset;
  }
}
#else
// Dataset provided, so return each input sequentially until the end of the dataset is reached
unsigned char* curr_dataset_pos = (unsigned char*) model_dataset;
unsigned char* get_next_dataset_input() {
  const size_t input_size = MODEL_INPUT_0_LEN * MODEL_INPUT_0_WIDTH;
  unsigned char* dataset;
  // If the current input set would spill over the dataset then stop
  if (curr_dataset_pos + input_size > model_dataset + MODEL_DATASET_LEN) {
    dataset = NULL;
  } else {
    dataset = curr_dataset_pos;
    curr_dataset_pos += input_size;
  }
  return dataset;
}
#endif


int main() {
  tflite::InitializeTarget();
  const tflite::Model* tflite_model = ::tflite::GetModel(model);
  TFLITE_CHECK_EQ(tflite_model->version(), TFLITE_SCHEMA_VERSION);

  // Call op resolver function provided by ADI generated file to avoid
  // having to identify which operators are used by the model.
  tflite::MicroMutableOpResolver<MODEL_NUM_OPERATORS> op_resolver;
  TF_LITE_ENSURE_STATUS(adi_resolve_ops_model(op_resolver));

  // Set up interpreter. The arena details are provided by the ADI generated file
  tflite::MicroInterpreter interpreter(tflite_model,
                                       op_resolver,
                                       model_arena,
                                       MODEL_ARENA_SIZE);

  TF_LITE_ENSURE_STATUS(interpreter.AllocateTensors());

  unsigned char *input_data = get_next_dataset_input();
  while(input_data != NULL) {
    // Copy the next inference worth of data to input buffer
    memcpy(interpreter.input(0)->data.raw, input_data, (MODEL_INPUT_0_LEN * MODEL_INPUT_0_WIDTH));
    // Invoke the inference
    TF_LITE_ENSURE_STATUS(interpreter.Invoke());

    #ifndef CONFIG_ZPL
    // Print the output buffer in hex format for debugging purposes.
    print_model_output(interpreter.output(0)->data.raw);
    #endif

    // Get the next inference worth of input data, or NULL if we've reached the end of the dataset.
    input_data = get_next_dataset_input();
  }

  return 0;
}


