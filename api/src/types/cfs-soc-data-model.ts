/**
 *
 * Copyright (c) 2024 Analog Devices, Inc.
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
type SocAddress = string;
type SocValue = string;

export interface CfsSocDataModel {
  Copyright: string;
  Version: string;
  Timestamp: string;
  Name: string;
  Description: string;
  Endianness: string;
  Parts: SocPart[];
  Cores: SocCore[];
  Controls: Record<string, SocControl[]>;
  Peripherals: SocPeripheral[];
  ClockNodes: SocClock[];
  Packages: SocPackage[];
  Registers: SocRegister[];
  Schema: string;
}

export interface SocPart {
  Name: string;
  Package: string;
  MemoryDescription: string;
}

export interface SocCore {
  Name: string;
  Description: string;
  ID: string;
  Memory: SocCoreMemory[];
}

export interface SocCoreMemory {
  Name: string;
  Description: string;
  AddressStart: string;
  AddressEnd: string;
  Width: number;
  Access: string;
  Location: string;
  Type: string;
}

export interface SocControl {
  Id: string;
  Description: string;
  Type: string;
  EnumValues?: SocControlValue[];
  Condition?: string;
  MinimumValue?: number;
  MaximumValue?: number;
  Units?: string;
  Default?: string | number;
  PluginOption?: boolean;
  Hint?: string;
  Pattern?: string;
}

export interface SocControlValue {
  Id: string;
  Description: string;
  Value: number;
}

interface SocPackage {
  Name: string;
  Description: string;
  NumPins: number;
  Pins: SocPin[];
}

export interface SocPin {
  Name: string;
  Label: string;
  Description: string;
  Position: {
    X: number;
    Y: number;
  };
  Shape: string;
  GPIOPort: string;
  GPIOPin: number;
  GPIOName: string;
  Signals: SocPinSignal[];
}

export interface SocPinConfig {
  Register: string;
  Field: string;
  Value: number;
  Operation?: string;
}

export interface SocPinSignal {
  Peripheral: string;
  Name: string;
  PinMuxSlot: number;
  PinMuxConfig: SocPinSignalConfig[];
  PinConfig: Record<string, Record<string, SocPinConfig[]>>;
  PinMuxNameZephyr?: string;
}

interface SocPinSignalConfig {
  Register: string;
  Field: string;
  Value: number;
  Operation?: string;
}

export interface SocClockNode {
  Name: string;
  Description: string;
  Config: Record<string, Record<string, SocPinConfig[]>>;
}

export interface SocConfigZephyr {
  Code?: string;
  Peripheral?: string;
  Clock?: string;
  Default?: boolean;
  Diagnostic?: string;
}

export interface SocRegister {
  Name: string;
  Description: string;
  Address: SocAddress;
  Size: number;
  Fields: SocRegisterField[];
}

export interface SocRegisterField {
  Name: string;
  Description: string;
  Position: number;
  Length: number;
  Reset: SocValue;
}

interface SocPeripheralZephyr {
  Name?: string;
  Header?: string;
  ConfigMacros?: string[];
  Diagnostic?: string;
  ClocksSection?: boolean;
  AlwaysEmitPinctrl0?: boolean;
  Pinctrl0Sub?: string;
}

export interface SocPeripheral {
  Name: string;
  Zephyr?: SocPeripheralZephyr;
  Description: string;
  Signals: SocPeripheralSignalConfig[];
  Initialization?: SocPeripheralInitializationConfig[];
}

interface SocPeripheralSignalConfig {
  Name: string;
  Description: string;
}

type SocPeripheralInitializationConfig = SocPinSignalConfig;

export interface SocClock {
  Name: string;
  Description: string;
  Type: string;
  Inputs: ClockInput[];
  Outputs: ClockOutput[];
  Config?: ClockConfig;
  ConfigUIOrder?: string[];
  ConfigProgrammingOrder?: string[];
  ConfigMSDK?: ConfigMSDK;
  ConfigZephyr?: Record<string, Record<string, SocConfigZephyr>>;
}

interface ClockInput {
  Name: string;
}

interface ClockOutput {
  Name: string;
  Description: string;
  Value: string;
}

interface NestedConfig {
  [key: string]: [] | ClockRegister[] | NestedConfig;
}

type ClockConfig = Record<string, NestedConfig>;

interface ClockRegister {
  Register?: string;
  Field: string;
  Value: number;
  Operation?: string;
}

interface ConfigCode {
  Code: string;
  Epilog: string;
  Headers: string[];
}

interface NestedConfigMSDK {
  [key: string]: ConfigCode | NestedConfigMSDK;
}

type ConfigMSDK = Record<
  string,
  NestedConfigMSDK | Record<string, never>
>;
