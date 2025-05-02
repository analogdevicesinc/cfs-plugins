/**
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

/* Functions for getting values from the data model.
 */

// Does the core support TrustZone?
function supportsTrustZone() {
  const core = it.datamodel.Cores.find(c => c.Id === it.coreId);
  return core.Memory.find(r => r.TrustZone);
}

// Return true if the ClockNode of given name exists on the canvas.
function clockNodeExists(name) {
  return it.datamodel.ClockNodes.find(n => n.Name === name);
}

// Extract the peripheral with given name from the data model.
function getPeripheral(name) {
  return it.datamodel.Peripherals.find(p => p.Name == name);
}

// Extract the information for the current package from the data model.
function getPackage() {
  return it.datamodel.Packages.find(package => package.Name.toLowerCase() === it.cfsconfig.Package.toLowerCase());
}

// Extract the pin information for the pin with given name from the data model.
function getPin(pin) {
  return getPackage()?.Pins.find(p => p.Name === pin.Pin);
}

// Extract the signal information for the given pin from the data model.
function getSignal(pin) {
  return getPin(pin)?.Signals.find(s => pin.Peripheral === s.Peripheral && pin.Signal === s.Name);
}

// Extract the control information for the given namespace and id from the data model.
function getControl(namespace, ctrlName) {
  return it.datamodel.Controls[namespace].find(c => c.Id === ctrl);
}

// Get the sequence for a setting from the data model.
function getSequence(config, namespace, ctrlName, value) {
  const ctrl = getControl(namespace, ctrlName);
  if (ctrl.Type === "enum") {
    return config[ctrlName][value];
  } else if (ctrl.Type === "boolean") {
    return config[ctrlName][value && value !== "FALSE" ? "TRUE" : "FALSE"];
  }
  return config[ctrlName].VALUE;
}

// Get the Control entry for a control from the data model.
function getControl(namespace, id) {
  return it.datamodel.Controls[namespace]?.find(c => c.Id === id);
}

// Get the description for a control from the data model.
function getControlDesc(namespace, ctrl) {
  const ctrlDm = getControl(namespace, ctrl);
  return ctrlDm?.Description;
}

// Get the setting description for a control's value from the data model.
function getSettingDesc(namespace, ctrl, value) {
  const ctrlDm = getControl(namespace, ctrl);
  if (ctrlDm?.EnumValues) {
    const enumNode = ctrlDm.EnumValues.find(e => e.Id === value);
    if (enumNode) {
      return enumNode.Description;
    }
  } else if (ctrlDm?.Type === "boolean") {
    if (value && value !== "FALSE") {
      return "true";
    } else {
      return "false";
    }
  }
  return value;
}

// Translate the value recorded in the cfsconfig file into a value
// that can be used in a sequence.
function translateValueForSequence(namespace, ctrl, value) {
  const ctrlDm = getControl(namespace, ctrl);
  if (ctrlDm?.Type === 'enum') {
    return ctrlDm.EnumValues.find(e => e.Id === value).Value;
  }
  return value;
}

/* Get the memory region this memory address belongs to.
*/
function getRegion(address) {
  const thisAddress = parseInt(address, 16);
  for (const region of it.datamodel.Cores.find(c => c.Id === it.coreId)?.Memory) {
    const start = parseInt(region.AddressStart, 16);
    const end = parseInt(region.AddressEnd, 16);
    if (thisAddress >= start && thisAddress <= end)
      return region;
  }
  return undefined;
}

/* Return true if the given partition overlaps the memory region.
*/
function partitionOverlapsRegion(partition, regionName) {
  const region = it.datamodel.Cores.find(c => c.Id === it.coreId)?.Memory?.find(r => r.Name === regionName);
  const startAddr = parseInt(partition.StartAddress, 16);
  const endAddr = startAddr + partition.Size - 1;
  const regionStartAddr = parseInt(region.AddressStart, 16);
  const regionEndAddr = parseInt(region.AddressEnd, 16);
  return (startAddr <= regionEndAddr && endAddr >= regionStartAddr);
}

/* Get the partitions for this project.
*/
function getProjectPartitions() {
  return getProject()?.Partitions?.filter(p => p.IsOwner) ?? [];
}

// Find the partition of the given name, regardless of project
function getPartition(partitionName) {
  for (let proj of it.cfsconfig.Projects) {
    const partition = proj.Partitions.find(p => p.Name === partitionName);
    if (partition)
      return partition;
  }
  return undefined;
}

/* Get the partitions for this project that start in this memory region.
*/
function getProjectPartitionsStartingInRegion(region) {
  const partitions = getProjectPartitions();
  return partitions.filter(p => getRegion(p.StartAddress) == region) ?? [];
}

// Get the name to use for this partition.
// Use the override key if defined to override the standard Name.
function getPartitionName(partition, override = undefined) {
  return override && partition.Config?.[override]?.length ? partition.Config?.[override] : partition.Name;
}

// Get the maximum length of the partition name.
function maxPartitionNameLength(override = undefined) {
  let maxLen = 0;
  for (const partition of getProject()?.Partitions ?? []) {
    if (getPartitionName(partition, override).length > maxLen) {
      maxLen = getPartitionName(partition, override).length;
    }
  }
  return maxLen;
}

/* Get the peripherals for this project.
*/
function getProjectPeripherals() {
  return getProject()?.Peripherals ?? [];
}

// Return true if peripheral is allocated to Secure project
function peripheralIsSecure(peri) {
  return it.cfsconfig.Projects?.find(prj => prj.Peripherals?.find(p => p.Name === peri) && prj.Secure);
}

/* Get the partitions for this project.
*/
function getProjectPartitions() {
  return getProject()?.Partitions?.filter(p => p.IsOwner) ?? [];
}

/* Get the partitions for this project that start in this memory region.
*/
function getProjectPartitionsStartingInRegion(region) {
  const partitions = getProjectPartitions();
  return partitions.filter(p => getRegion(p.StartAddress) == region) ?? [];
}


// Return true if any part of memory block is allocated to Secure project
function memoryRegionIsSecure(region) {
  const secureProject = it.cfsconfig.Projects?.find(p => p.CoreId === it.coreId && p.Secure);
  return secureProject?.Partitions?.find(p => partitionOverlapsRegion(p, region));
}

/* Functions for getting values from the cfsconfig file.
 */

// Get the Project entry from the cfsconfig file.
function getProject() {
  return it.cfsconfig.Projects?.find(p => p.ProjectId == it.projectId);
}

// Is the current project the primary one?
function isPrimaryProject() {
  return (it.datamodel.Cores.find(c => c.Id === it.coreId)?.IsPrimary &&
          (typeof getProject().Secure === "undefined" || getProject().Secure));
}

// Get the setting for a clock control from the cfsconfig file.
function getClockSetting(node, ctrl, defaultValue = undefined) {
  return it.cfsconfig.ClockNodes.find(n => n.Name === node && n.Control === ctrl && n.Enabled)?.Value ?? defaultValue;
}

// Get the block of peripheral data in the project, if any.
function getAssignedPeripheral(instance) {
  const proj = it.cfsconfig.Projects?.find(p => p.ProjectId == it.projectId);
  return proj?.Peripherals?.find(p => p.Name == instance);
}

// Return the ID of the project this peripheral is assigned to, if any.
function getAssignedProjectForPeripheral(instance) {
  return it.cfsconfig.Projects?.find(c => c.Peripherals?.find(p => p.Name === instance))?.ProjectId;
}

// Get the signal block for a peripheral and signal in the Projects section, if any
function getAssignedSignal(peripheral, signal, pinname) {
  const pin = it.cfsconfig.Pins.find(p => p.Peripheral === peripheral && p.Signal === signal);
  if (pin?.Pin === pinname) {
    const assignedPeripheral = getAssignedPeripheral(peripheral);
    return assignedPeripheral?.Signals?.find(s => s.Name === signal);
  }
  return undefined;
}

// Get the signal block for a pin in the Projects section, if any
function getAssignedPinSignal(pin) {
  return getAssignedSignal(pin.Peripheral, pin.Signal, pin.Pin);
}

// Get any user description associated with the peripheral.
function getPeripheralDescription(instance) {
  const assignedPeripheral = getAssignedPeripheral(instance);
  return assignedPeripheral?.Description?.length > 0 ? assignedPeripheral.Description : undefined;
}

// Return the ID of the project this pin is assigned to, if any.
function getAssignedProjectForPin(pin) {
  return it.cfsconfig.Projects?.find(c => c.Peripherals?.find(p => p.Name === pin.Peripheral)?.Signals.find(s => s.Name === pin.Signal))?.ProjectId;
}

/* Functions for getting pin settings from cfsconfig file.
 */

// Get the description for this signal setting.
function getSignalSettingDesc(signal, ctrl) {
  const value = signal.Config[ctrl];
  const ctrlNode = it.datamodel.Controls.PinConfig.find(c => c.Id === ctrl);
  if (ctrlNode?.EnumValues) {
    const enumNode = ctrlNode.EnumValues.find(e => e.Id === value);
    return enumNode?.Description;
  }
  return undefined;
}

/* Functions for getting clock settings from cfsconfig file.
 */

// Should we emit this setting in this project?
function assignedHere(peripherals) {
  if (peripherals.length > 0) {
    for (peripheral of peripherals) {
      if (getAssignedPeripheral(peripheral))
        return true;
    }
  } else {
    // Not associated with a peripheral. Emit if we're the primary project.
    return isPrimaryProject();
  }
  return false;
}

// Is the clock control "ctrl" for clock node "node" set to "value"?
// Return false if none of the given "peripherals" are assigned to the
// current project.
function isClockSetTo(peripherals, node, ctrl, value) {
  const entry = getClockSetting(node, ctrl);
  return assignedHere(peripherals) && entry && entry === value;
}

// Is this clock control "ctrl" for clock node "node" set, to anything?
// Return false if none of the given "peripherals" are assigned to the
// current project.
function isClockSet(peripherals, node, ctrl) {
  const entries = it.cfsconfig.ClockNodes.filter(n => n.Name === node && n.Control === ctrl && n.Enabled);
  return assignedHere(peripherals) && (entries.length > 0);
}

// Is any setting for clock node "node" set?
// Return false if none of the given "peripherals" are assigned to the
// current project.
function isClockAnySet(peripherals, node) {
  return assignedHere(peripherals) && it.cfsconfig.ClockNodes.filter(n => n.Name === node && n.Enabled).length > 0;
}

// Is any instance of the peripheral block assigned to this project?
function anyInstanceAssigned(peripheral) {
  const max_peripheral_num = 20;
  if (getAssignedPeripheral(peripheral))
    return true;
  for (var i = 0; i < max_peripheral_num; i += 1) {
    if (getAssignedPeripheral(peripheral + i))
      return true;
  }
  return false;
}

// Has any instance of the peripheral block assigned to this project
// got the ctrl set to value?
function anyInstanceAssignedSetTo(peripheral, ctrl, value) {
  const max_peripheral_num = 20;
  let assignedPeripheral = getAssignedPeripheral(peripheral);
  if (assignedPeripheral?.Config?.[ctrl] === value)
    return true;
  for (var i = 0; i < max_peripheral_num; i += 1) {
    assignedPeripheral = getAssignedPeripheral(peripheral + i);
    if (assignedPeripheral?.Config?.[ctrl] === value)
      return true;
  }
  return false;
}

// Is the clock control "ctrl" for clock node "node" set to "value"?
// Doesn't worry which project the peripheral is assigned to, if any.
function isClockSetToAnyProject(node, ctrl, value) {
  const entry = getClockSetting(node, ctrl);
  return entry && entry === value;
}

// Is this clock control "ctrl" for clock node "node" set, to anything?
// Doesn't worry which project the peripheral is assigned to, if any.
function isClockSetAnyProject(node, ctrl) {
  const entries = it.cfsconfig.ClockNodes.filter(n => n.Name === node && n.Control === ctrl && n.Enabled);
  return (entries.length > 0);
}

// Get the description for this clock setting.
function getClockSettingDesc(node, ctrl) {
  const value = getClockSetting(node, ctrl);
  return getSettingDesc('ClockConfig', ctrl, value);
}

// Default value for whether the part supports Clock Configuration or not. May be
// overridden in part-specific file.
function hasClockConfig() {
  return true;
}
