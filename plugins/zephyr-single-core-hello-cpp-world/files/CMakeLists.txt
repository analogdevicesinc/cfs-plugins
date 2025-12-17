# Portions Copyright (c) 2025 Analog Devices, Inc.
# SPDX-License-Identifier: Apache-2.0

cmake_minimum_required(VERSION 3.20.0)
find_package(Zephyr REQUIRED HINTS $ENV{ZEPHYR_BASE})
project(hello_cpp_world)

# Include ADI Generated AI model support if enabled
if(EXISTS "${CMAKE_SOURCE_DIR}/aimodels.cmake")
    include("${CMAKE_SOURCE_DIR}/aimodels.cmake")
endif()

# Include compiler flags to enable source navigation with ELF File Explorer
zephyr_cc_option(-fstack-usage)
zephyr_cc_option(-fdump-ipa-cgraph)
zephyr_cc_option(-gdwarf-4)

target_sources(app PRIVATE src/main.cpp)
