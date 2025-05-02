/**
 *
 * Copyright (c) 2024-2025 Analog Devices, Inc.
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

// @TODO: There should be a single type definition for the CFS config that all components can use
// (UI, CLI, cfs-lib?). Probably all components need to consume the type defined in here.

export interface CfsConfig extends Record<string, unknown> {
  Copyright: string;
  DataModelVersion: string;
  DataModelSchemaVersion: string;
  Soc: string;
  Package: string;
  Pins: ConfiguredPin[];
  ClockNodes: [];
  Timestamp: string;
  BoardName: string;
  Projects: ConfiguredProject[];
}

export interface ConfiguredPin {
  Pin: string;
  Peripheral: string;
  Signal: string;
  Errors?: Record<string, ControlErrorTypes | undefined>;
}

export interface ConfiguredClockNode {
  Name: string;
  Control: string;
  Value: string;
  Error?: ControlErrorTypes;
  Enabled?: boolean;
}

export interface ConfiguredProject {
  CoreId: string;
  ProjectId: string;
  FirmwarePlatform: string;
  ExternallyManaged: boolean;
  Partitions: ConfiguredPartition[];
  Peripherals: ConfiguredPeripheral[];
  PluginId: string;
  PluginVersion: string;
  PlatformConfig: Record<string, string>;
  Secure?: boolean;
  ZephyrId?: string;
}

export interface ConfiguredPeripheral {
  Name: string;
  Description?: string;
  Signals: {
    Name: string;
    Description?: string;
    Config?: Record<string, string>;
    PluginConfig?: PluginConfig;
  }[];
  Config: Record<string, string>;
}

export interface ConfiguredPartition {
  Name: string;
  StartAddress: string;
  Size: number;
  IsOwner: boolean;
  Config: PluginConfig;
  Access: string;
}

export type PluginConfig = Record<string, string | number | boolean>;

export type ControlErrorTypes =
  | "INVALID_INTEGER"
  | "INVALID_TEXT"
  | "INVALID_MIN_VAL"
  | "INVALID_MAX_VAL";
