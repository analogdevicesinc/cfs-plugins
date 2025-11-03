/**
 *
 * Copyright (c) 2025 Analog Devices, Inc.
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

/* eslint-disable @typescript-eslint/prefer-regexp-exec */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { CfsFeatureScope } from "../../types/cfs-feature.js";
import type { CfsPluginInfo } from "../../types/cfs-plugin-info.js";
import type {
  CfsSocDataModel,
  SocControl
} from "../../types/cfs-soc-data-model.js";

type OverrideSocControl = SocControl & { partRegexp: string };
interface SocControlId {
  Id: string;
  partRegexp?: string;
}

interface DefaultOverride {
  Id: string;
  Value: string | number;
  partRegexp?: string;
}

interface ControlDirective {
  supportedControls?: SocControlId[];
  removedControls?: SocControlId[];
  addedControls?: OverrideSocControl[];
  modifiedControls?: OverrideSocControl[];
  defaultOverrides?: DefaultOverride[];
}

/* Determine the list of supported controls for the plugin.
 */
function updateControlsFromPlugin(
  soc: CfsSocDataModel,
  currentControls: SocControl[],
  directive: ControlDirective
) {
  const {
    supportedControls,
    addedControls,
    removedControls,
    modifiedControls,
    defaultOverrides
  } = directive;

  // Apply supported or removed controls
  if (supportedControls) {
    currentControls = currentControls.filter((control) =>
      supportedControls.find((supportedControl) => {
        if (typeof supportedControl.partRegexp === "string") {
          const regexp = new RegExp(supportedControl.partRegexp);
          if (!regexp.test(soc.Name)) {
            return false;
          }
        }

        return control.Id === supportedControl.Id;
      })
    );
  } else if (removedControls) {
    removedControls.forEach((removedControl) => {
      currentControls = currentControls.filter((control) => {
        if (typeof removedControl.partRegexp === "string") {
          const regexp = new RegExp(removedControl.partRegexp);
          if (!regexp.test(soc.Name)) {
            return true;
          }
        }

        return control.Id !== removedControl.Id;
      });
    });
  }

  // Add controls from plugin
  if (addedControls) {
    addedControls.forEach((addedControl) => {
      if (typeof addedControl.partRegexp === "string") {
        const regexp = new RegExp(addedControl.partRegexp);
        if (!regexp.test(soc.Name)) {
          return;
        }
      }

      currentControls.push({
        ...addedControl,
        PluginOption: true
      } as SocControl);
    });
  }

  // Modify controls
  if (modifiedControls) {
    modifiedControls.forEach((modifiedControl) => {
      const controlIndex = currentControls.findIndex((control) => {
        if (typeof modifiedControl.partRegexp === "string") {
          const regexp = new RegExp(modifiedControl.partRegexp);
          if (!regexp.test(soc.Name)) {
            return false;
          }
        }

        return control.Id === modifiedControl.Id;
      });

      if (controlIndex !== -1) {
        currentControls[controlIndex] = {
          ...currentControls[controlIndex],
          ...modifiedControl
        };
      }
    });
  }

  // Apply default overrides
  if (defaultOverrides && soc) {
    defaultOverrides.forEach((defaultOverride) => {
      if (typeof defaultOverride.partRegexp === "string") {
        const regexp = new RegExp(defaultOverride.partRegexp);
        if (!regexp.test(soc.Name)) {
          return;
        }
      }

      const controlIndex = currentControls.findIndex(
        (control) => control.Id === defaultOverride.Id
      );

      if (controlIndex !== -1) {
        currentControls[controlIndex] = {
          ...currentControls[controlIndex],
          Default: defaultOverride.Value
        };
      }
    });
  }

  return currentControls;
}

/**
 * Service for handling property control directives in CFS plugins
 */
export class CfsSocControlsOverride {
  /**
   * Constructor
   * @param cfsPluginInfo - The plugin information containing property directives
   */
  constructor(protected cfsPluginInfo: CfsPluginInfo) {}

  /**
   * Get properties for a specific scope with control directives applied
   * @param scope - The scope of properties to retrieve (Peripheral, PinConfig, etc.)
   * @param soc - Optional SoC data model containing control definitions
   * @returns The properties with control directives applied
   */
  overrideControls(
    scope: CfsFeatureScope,
    soc: CfsSocDataModel
  ): Record<string, SocControl[]> {
    const controls: Record<string, SocControl[]> = JSON.parse(
      JSON.stringify(soc.Controls)
    ) as Record<string, SocControl[]>;

    // Handle Peripheral scope
    if (scope === CfsFeatureScope.Peripheral) {
      delete controls.ClockConfig;
      delete controls.PinConfig;

      const directives = this.cfsPluginInfo.properties?.[
        scope
      ] as unknown as Record<string, ControlDirective> | undefined;

      const result = Object.entries(controls).reduce<
        Record<string, SocControl[]>
      >((acc, [targetName, targetControls]) => {
        if (!targetName.match(" DFG(Stream|Gasket)Config")) {
          const directive = directives?.[targetName] ?? {};

          if (Object.keys(directive).length > 0) {
            acc[targetName] = updateControlsFromPlugin(
              soc,
              [...targetControls],
              directive
            );
          } else {
            acc[targetName] = targetControls;
          }
        }
        return acc;
      }, {});

      return result;
    }

    // Handle DFG scope
    if (scope === CfsFeatureScope.DFG) {
      delete controls.ClockConfig;
      delete controls.PinConfig;

      const directives = this.cfsPluginInfo.properties?.[
        scope
      ] as unknown as Record<string, ControlDirective> | undefined;

      const result = Object.entries(controls).reduce<
        Record<string, SocControl[]>
      >((acc, [targetName, targetControls]) => {
        if (targetName.match(" DFG(Stream|Gasket)Config")) {
          const directive = directives?.[targetName] ?? {};

          if (Object.keys(directive).length > 0) {
            acc[targetName] = updateControlsFromPlugin(
              soc,
              [...targetControls],
              directive
            );
          } else {
            acc[targetName] = targetControls;
          }
        }
        return acc;
      }, {});

      return result;
    }

    // Handle Memory scope
    if (scope === CfsFeatureScope.Memory) {
      const directives = this.cfsPluginInfo.properties?.[
        scope
      ] as unknown as ControlDirective | undefined;
      const memoryControls: SocControl[] = [];

      if (directives?.addedControls) {
        directives.addedControls.forEach((control) => {
          memoryControls.push({
            ...control,
            PluginOption: true
          } as SocControl);
        });
      }

      return { [scope]: memoryControls };
    }

    // Handle PinConfig scope
    if (scope === CfsFeatureScope.PinConfig) {
      const formattedScope =
        scope.charAt(0).toUpperCase() + scope.slice(1);
      const directives = this.cfsPluginInfo.properties?.[
        scope
      ] as unknown as ControlDirective | undefined;

      const targetControls = updateControlsFromPlugin(
        soc,
        [...controls[formattedScope]],
        directives ?? {}
      );

      return { [formattedScope]: targetControls };
    }

    if (scope === CfsFeatureScope.ClockConfig) {
      const result: Record<string, SocControl[]> = {};
      const formattedScope =
        scope.charAt(0).toUpperCase() + scope.slice(1);

      const directives = this.cfsPluginInfo.properties?.[
        scope
      ] as unknown as Record<string, ControlDirective> | undefined;

      // Process each clock node
      for (const clockNode of soc.ClockNodes) {
        const nodeName = clockNode.Name;
        const directive = directives?.[nodeName] ?? {};

        // Skip nodes that don't have a ConfigUIOrder property
        if (clockNode.ConfigUIOrder === undefined) {
          continue;
        }

        let nodeControls: SocControl[] = [];

        if (controls[formattedScope]) {
          // Build nodeControls in the order defined by ConfigUIOrder
          for (const controlId of clockNode.ConfigUIOrder) {
            const control = controls[formattedScope].find(
              (c) => c.Id === controlId
            );

            if (control) {
              nodeControls.push({ ...control });
            }
          }
        }

        // Apply directive modifications if present
        if (Object.keys(directive).length > 0) {
          nodeControls = updateControlsFromPlugin(
            soc,
            nodeControls,
            directive
          );
        }

        if (nodeControls.length > 0) {
          result[nodeName] = nodeControls;
        }
      }

      return result;
    }

    return {};
  }
}
