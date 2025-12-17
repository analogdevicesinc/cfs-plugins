# Portions Copyright (c) 2025 Analog Devices, Inc.
# SPDX-License-Identifier: Apache-2.0

cmake_minimum_required(VERSION 3.20.0)
find_package(Zephyr REQUIRED HINTS $ENV{ZEPHYR_BASE})
project(philosophers)

if(DEFINED DEBUG_PRINTF)
  zephyr_compile_definitions(DEBUG_PRINTF=${DEBUG_PRINTF})
endif()
if(DEFINED SAME_PRIO)
  zephyr_compile_definitions(SAME_PRIO)
endif()
if(DEFINED STATIC_OBJS)
  zephyr_compile_definitions(STATIC_OBJS)
endif()
if(DEFINED FORKS)
  zephyr_compile_definitions(FORKS=${FORKS})
endif()

# Include ADI Generated AI model support if enabled
if(EXISTS "${CMAKE_SOURCE_DIR}/aimodels.cmake")
    include("${CMAKE_SOURCE_DIR}/aimodels.cmake")
endif()

# Include compiler flags to enable source navigation with ELF File Explorer
zephyr_cc_option(-fstack-usage)
zephyr_cc_option(-fdump-ipa-cgraph)
zephyr_cc_option(-gdwarf-4)

target_sources(app PRIVATE src/main.c)
target_include_directories(app PRIVATE src)