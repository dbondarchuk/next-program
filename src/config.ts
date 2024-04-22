import { YamlInclude } from "yaml-js-include";
import { GlobalConfig } from "./config.types";

export const getConfig = async (filePath: string): Promise<GlobalConfig> => {
  const yamlInclude = new YamlInclude();

  return await yamlInclude.loadAsync<GlobalConfig>(filePath);
};
