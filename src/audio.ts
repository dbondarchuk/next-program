import * as path from "path";
import * as fs from "fs/promises";
import { existsSync } from "fs";
import { ProgrammeInfo } from "./types";
import { createAudioFile } from "simple-tts-mp3";
import Handlebars from "handlebars";
import { decodeHTMLSpecialCharacters } from "./utils";

const audioFolder = "./audio";

export const getVoiceOverAudio = async (
  programmeInfo: ProgrammeInfo,
  text: string
) => {
  const audioFilename = `${programmeInfo.showName} - ${programmeInfo.episodeNum} - ${programmeInfo.channelLanguage}`;
  if (!existsSync(audioFolder)) {
    await fs.mkdir(audioFolder, { recursive: true });
  }

  const outputFile = path.join(audioFolder, `${audioFilename}`);
  const expectedPath = `${outputFile}.mp3`;
  if (existsSync(expectedPath)) {
    return expectedPath;
  }

  const template = Handlebars.compile(text);
  const ttsText = decodeHTMLSpecialCharacters(template(programmeInfo));

  const resultPath = await createAudioFile(
    ttsText,
    outputFile,
    programmeInfo.channelLanguage
  );

  return resultPath;
};
