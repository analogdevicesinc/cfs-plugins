#
# Copyright (c) 2019 Peter Bigot Consulting, LLC
# Portions Copyright (c) 2025 Analog Devices, Inc.
#
# SPDX-License-Identifier: Apache-2.0
#

cmake_minimum_required(VERSION 3.20.0)
file(GLOB board_overlays "${CMAKE_CURRENT_SOURCE_DIR}/boards/*.overlay")
list(REMOVE_ITEM board_overlays "${CMAKE_CURRENT_SOURCE_DIR}/boards/mount_littlefs.overlay")
list(JOIN board_overlays ";" DTC_OVERLAY_FILE)
set(DTC_OVERLAY_FILE "${DTC_OVERLAY_FILE};${CMAKE_CURRENT_SOURCE_DIR}/boards/mount_littlefs.overlay"
    CACHE STRING "" FORCE)

find_package(Zephyr REQUIRED HINTS $ENV{ZEPHYR_BASE})
project(littlefs)

# Include ADI Generated AI model support if enabled
if(EXISTS "${CMAKE_SOURCE_DIR}/aimodels.cmake")
    include("${CMAKE_SOURCE_DIR}/aimodels.cmake")
endif()

# Include compiler flags to enable source navigation with ELF File Explorer
zephyr_cc_option(-fstack-usage)
zephyr_cc_option(-fdump-ipa-cgraph)
zephyr_cc_option(-gdwarf-4)

FILE(GLOB app_sources src/*.c)
target_sources(app PRIVATE ${app_sources})
