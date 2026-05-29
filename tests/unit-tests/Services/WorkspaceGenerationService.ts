/**
 *
 * Copyright (c) 2025-2026 Analog Devices, Inc.
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
import type { CfsPluginInfo, CfsWorkspace, CfsProject } from "cfs-types";

export class WorkspaceGenerationService {
  protected readonly pluginInfo: CfsPluginInfo;

  constructor(pluginInfoParam: CfsPluginInfo) {
    this.pluginInfo = pluginInfoParam;
  }

  /**
   * Creates a CfsWorkspace object based on SOC, MCUbootKeyType, and projects
   * @param soc - The SOC name (e.g., "MAX32657", "MAX32658")
   * @param mcubootKeyType - The MCUboot key type (e.g., "rsa-3072", "rsa-2048", "ecdsa-p256", "ed25519")
   * @param projects - Array of projects to include in the workspace
   * @param workspaceLocation - The location where the workspace will be generated
   * @returns A CfsWorkspace object configured with the plugin data
   */
  public async createCfsWorkspaceList(
    soc: string,
    mcubootKeyType: string,
    projects: Partial<CfsProject>[],
    workspaceLocation: string,
  ): Promise<CfsWorkspace[]> {

    const cfsWorkspaces: CfsWorkspace[] = [];
    // Find the matching SOC in the plugin's supported SOCs
    const supportedSocInfos = this.pluginInfo?.supportedSocs.filter(
      (s) => s.name.toLowerCase() === soc.toLowerCase(),
     ) ?? [];
     if (supportedSocInfos.length === 0) {
       throw new Error(`No supported SOC found matching "${soc}".`);
     }
     
    for(const oneSoc of supportedSocInfos) {
      const mcubootImgtoolPathProperty =
        this.pluginInfo?.properties?.workspace?.find(
          (prop) => prop.id === "MCUbootImgtoolPath",
        );

      const cfsWorkspace: CfsWorkspace = {
        location: workspaceLocation,
        workspacePluginId: this.pluginInfo?.pluginId,
        workspacePluginVersion: this.pluginInfo?.pluginVersion,
        workspaceName: `${soc.toLowerCase()}-workspace`,
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: oneSoc.dataModelVersion,
        package: oneSoc.package,
        timestamp: new Date().toISOString(),
        board: oneSoc.board,
        soc: soc,
        MCUbootImgtoolPath: mcubootImgtoolPathProperty?.default || "",
        MCUbootKeyType: mcubootKeyType,
        projects: projects,
      };

      cfsWorkspaces.push(cfsWorkspace);
    }

    return cfsWorkspaces;
  }
}
