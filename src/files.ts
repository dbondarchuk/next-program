import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import { GlobalConfig } from "./config.types";
import { ProgrammeInfo } from "./types";

const extensions = new Set([
  "webm",
  "mkv",
  "flv",
  "vob",
  "ogv",
  "ogg",
  "rrc",
  "gifv",
  "mng",
  "mov",
  "avi",
  "qt",
  "wmv",
  "yuv",
  "rm",
  "asf",
  "amv",
  "mp4",
  "m4p",
  "m4v",
  "mpg",
  "mp2",
  "mpeg",
  "mpe",
  "mpv",
  "m4v",
  "svi",
  "3gp",
  "3g2",
  "mxf",
  "roq",
  "nsv",
  "flv",
  "f4v",
  "f4p",
  "f4a",
  "f4b",
  "mod",
]);

const findFileFallback = async (
  config: GlobalConfig,
  programme: ProgrammeInfo
) => {
  const allShows = await fs.readdir(config.inputDirectory, {
    withFileTypes: true,
  });

  const showDir = allShows.find(
    (s) =>
      s.isDirectory() &&
      s.name
        .toLocaleLowerCase()
        .indexOf(programme.showName.toLocaleLowerCase()) >= 0
  );

  if (!showDir) {
    throw new Error(`Can't find a directory for show '${programme.showName}'`);
  }

  const showDirPath = path.join(config.inputDirectory, showDir.name);
  const allFiles = await fs.readdir(showDirPath, { recursive: true });

  const files = allFiles
    .filter(
      (file) =>
        !path.basename(file).startsWith(".") &&
        path.basename(file).indexOf(programme.episodeNum) >= 0 &&
        extensions.has(path.extname(file).substring(1))
    ) // remove . from ext name
    .map((file) => path.join(showDirPath, file));

  return files[0];
};

export const findFile = async (
  config: GlobalConfig,
  programme: ProgrammeInfo
) => {
  const allShows = await fs.readdir(config.inputDirectory, {
    withFileTypes: true,
  });

  const showDir = allShows.find(
    (s) =>
      s.isDirectory() &&
      s.name
        .toLocaleLowerCase()
        .indexOf(programme.showName.toLocaleLowerCase()) >= 0
  );

  if (!showDir) {
    throw new Error(`Can't find a directory for show '${programme.showName}'`);
  }

  const showDirPath = path.join(config.inputDirectory, showDir.name);
  const showDirDirs = await fs.readdir(showDirPath, {
    withFileTypes: true,
  });

  const seasonDir = showDirDirs.find((s) => {
    if (!s.isDirectory()) return false;
    const seasonMatch = s.name.match(/(\d+)/)?.[1];
    if (!seasonMatch) return false;
    return (
      seasonMatch === programme.season.toString() ||
      seasonMatch === `0${programme.season}`
    );
  });

  if (!seasonDir) {
    throw new Error(
      `Can't find a directory for season ${programme.season} of the show '${programme.showName}'`
    );
  }

  const seasonDirPath = path.join(showDirPath, seasonDir.name);

  const allFiles = await fs.readdir(seasonDirPath);

  const files = allFiles
    .filter(
      (file) =>
        !path.basename(file).startsWith(".") &&
        (path.basename(file).indexOf(`E${programme.episode}`) >= 0 ||
          path.basename(file).indexOf(`E0${programme.episode}`) >= 0) &&
        extensions.has(path.extname(file).substring(1))
    ) // remove . from ext name
    .map((file) => path.join(seasonDirPath, file));

  if (files.length == 0) {
    return await findFileFallback(config, programme);
  }

  return files[0];
};
