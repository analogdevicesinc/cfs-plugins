/*
 * Generated C representation of model on Wed Apr 29 15:33:49 2026. Do not modify.

Model summary:
--------------
Inputs: 1
Outputs: 1
Tensors: 10
Operators 1:
  FullyConnected


Model graph:
------------
Subgraph 0 "main": Inputs: 1, Outputs: 1, Operators: 1, Tensors: 10
  Inputs (1):
    0: serving_default_dense_input:0: [1, 1]
  Outputs (1):
    0: StatefulPartitionedCall:0: [1, 1]
  Operators (1):
    0: FullyConnected
  Tensors (10):
    0: serving_default_dense_input:0
    1: sequential/dense_1/BiasAdd/ReadVariableOp
    2: sequential/dense_2/BiasAdd/ReadVariableOp
    3: sequential/dense/BiasAdd/ReadVariableOp
    4: sequential/dense/MatMul
    5: sequential/dense_1/MatMul
    6: sequential/dense_2/MatMul
    7: sequential/dense/MatMul;sequential/dense/Relu;sequential/dense/BiasAdd
    8: sequential/dense_1/MatMul;sequential/dense_1/Relu;sequential/dense_1/BiasAdd
    9: StatefulPartitionedCall:0

*/

#define MODEL_LEN (3164)
/* Arena size for model (estimated)*/
#define MODEL_ARENA_SIZE (2888)
#define MODEL_INPUT_0_WIDTH (4)
#define MODEL_INPUT_0_LEN (1)
#define MODEL_OUTPUT_0_WIDTH (4)
#define MODEL_OUTPUT_0_LEN (1)
#define MODEL_NUM_OPERATORS (1)


#if defined(__cplusplus)
#pragma GCC diagnostic push
// TFLM library mixes float/double literals which produces warnings
#pragma GCC diagnostic ignored "-Wdouble-promotion"
#include "tensorflow/lite/micro/micro_mutable_op_resolver.h"
#pragma GCC diagnostic pop

TfLiteStatus adi_resolve_ops_model (tflite::MicroMutableOpResolver<MODEL_NUM_OPERATORS>& resolver); 
#else /* __cplusplus */ 
#warning TensorFlow Lite Micro sources require C++ for full functionality
#endif /* __cplusplus */

extern unsigned char model_arena[] __attribute__((aligned(16)));

extern const unsigned char model[] __attribute__((aligned(16)));

