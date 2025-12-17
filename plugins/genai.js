// Copyright (c) 2025 Analog Devices, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// genai.ts script to invoke cfsai to regenerate the ai collateral files
// in any plugin with an 'aiGenCommand'
//
// invoke with 'yarn genai'

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { globSync } from "glob"; 

// Get list of .cfsplugin files
const files = globSync("*/.cfsplugin", { ignore: ["node_modules/**"] });

if (files.length === 0) {
  console.log("No plugin files found.");
  process.exit(0);
}

for (const file of files) {
  try {
    const plugin = JSON.parse(fs.readFileSync(file, "utf8"));
    const dir = path.dirname(file)

    // Check if file has an 'aiGenCommand'
    if (typeof plugin.aiGenCommand === "string" && plugin.aiGenCommand.trim() !== "") {
      const cmd = `cfsai --json ${plugin.aiGenCommand}`;
      console.log(`Generating ${dir}`);

      // Run the command
      const output = execSync(cmd, { encoding: "utf8", cwd: dir });

      // Look for created files
      const paths = output
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            const obj = JSON.parse(line);
            return obj.file_created_event?.path;
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    
      // Remove the 'on <time-and-date>' in the comment from the files. 
      // Regex explanation:
      //  [1] (Generated...of [^*]+?) - record up to the space before 'on' and record in '$1'.
      //  [2] \s+on\s+.*?             - everything between [1] and [3], which is what we want to remove. 
      //  [3] (?=\. Do not modify\.)  - chunk to be left as is.
      for (const p of paths) {
        const fullPath = path.join(dir,p);
        let content = fs.readFileSync(fullPath, 'utf8');
        content = content.replace(
  /(Generated C representation of [^*]+?)\s+on\s+.*?(?=\. Do not modify\.)/,
  '$1'
);
        fs.writeFileSync(fullPath, content, 'utf8');

        console.log("\t" + p);
      }
     
    } 
  } catch (err) {
    console.error(`Error processing ${file}:`, err.message);
    process.exit(1);
  }
}
