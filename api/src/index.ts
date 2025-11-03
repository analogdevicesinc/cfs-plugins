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

export { CfsFeatureScope } from "./types/cfs-feature.js";

/* Types */
export type {
  CfsConfig,
  ConfiguredClockNode,
  ConfiguredPartition,
  ConfiguredPeripheral,
  ConfiguredPin,
  ConfiguredProject,
  ControlErrorTypes,
  DFGEndpoint,
  PluginConfig,
  DFG,
  DFGStream,
  GasketConfig,
  AIModel,
  Profiling,
  Zephelin
} from "./types/cfs-config.d.ts";
export type {
  CfsCodeGenerationService,
  CfsProjectConfigService,
  CfsProjectGenerationService,
  CfsPropertyProviderService,
  CfsSocControlsOverrideService,
  CfsSystemConfigService,
  CfsWorkspaceGenerationService
} from "./types/cfs-services.d.ts";
export type { CfsFeature } from "./types/cfs-feature.d.ts";
export type { CfsFileMap } from "./types/cfs-file-map.d.ts";
export type { CfsPluginInfo } from "./types/cfs-plugin-info.d.ts";
export type { CfsPluginProperty } from "./types/cfs-plugin-property.d.ts";
export type { CfsProject } from "./types/cfs-project.d.ts";
export type {
  CfsSocDataModel,
  SocClock,
  SocClockNode,
  SocClockOutput,
  SocControl,
  SocControlValue,
  SocCore,
  SocCoreMemory,
  SocCoreMemoryRef,
  SocCoreMemoryType,
  SocPart,
  SocPeripheral,
  SocPin,
  SocPinConfig,
  SocPinSignal,
  SocRegister,
  SocRegisterField,
  SocConfigFields,
  SocConfigField,
  SocPackage,
  SocPinCanvas,
  SocPinCanvasLabel,
  SocGasketInputStream,
  SocGasketOutputStream,
  SocGasket
} from "./types/cfs-soc-data-model.d.ts";
export type {
  SocDiagramData,
  SocDiagramClocks,
  SocCanvasClockCoordinates,
  SocDiagramNode,
  SocNodeTerminal,
  SocDiagramStyles
} from "./types/cfs-soc-diagram-data.d.ts";
export type { CfsSocInfo } from "./types/cfs-soc-info.d.ts";
export type { CfsWorkspace } from "./types/cfs-workspace.d.ts";
export type { CfsCodeGenerationContext } from "./types/cfs-code-generation.d.ts";
export type { CfsPlugin } from "./types/cfs-plugin.d.ts";

/* Generic Plugin Components */
export { GenericPlugin } from "./generic/cfs-generic-plugin.js";
export { PropertyProvider } from "./generic/components/cfs-property-provider.js";
export { CfsEtaCodeGenerator } from "./generic/components/eta/cfs-eta-code-generator.js";
export { CfsEtaProjectGenerator } from "./generic/components/eta/cfs-eta-project-generator.js";
export { CfsEtaWorkspaceGenerator } from "./generic/components/eta/cfs-eta-workspace-generator.js";
export { CfsSSPlusProjectGenerator } from "./generic/components/ssplus/cfs-ssplus-project-generator.js";
export { CfsJsonProjectConfig } from "./generic/components/cfs-json-project-config.js";
export { CfsJsonSystemConfig } from "./generic/components/cfs-json-system-config.js";
export { CfsSocControlsOverride } from "./generic/components/cfs-soc-controls-override.js";

/* Utilities */
export { evalNestedTemplateLiterals } from "./generic/utilities/cfs-utilities.js";
