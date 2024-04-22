import * as path from "path";
import * as fs from "fs/promises";
import { existsSync } from "fs";
import { ProgrammeInfo } from "./types";
import { createAudioFile } from "simple-tts-mp3";
import Handlebars from "handlebars";
import { decodeHTMLSpecialCharacters } from "./utils";
import { translate } from "./translate";

const audioFolder = "./audio";

export const getVoiceOverAudio = async (
  programmeInfo: ProgrammeInfo,
  text: string
) => {
  const audioFilename = `${programmeInfo.showName} - ${programmeInfo.episodeNum} - ${programmeInfo.channelLanguage}`;
  console.log(`Looking to get audio naration for ${audioFilename}`);

  if (!existsSync(audioFolder)) {
    await fs.mkdir(audioFolder, { recursive: true });
  }

  const outputFile = path.join(audioFolder, `${audioFilename}`);
  const expectedPath = `${outputFile}.mp3`;
  if (existsSync(expectedPath)) {
    console.log(`Found existing file ${expectedPath}`);

    return expectedPath;
  }

  const programmeInfoCopy: ProgrammeInfo = {
    ...programmeInfo,
    episodeName: programmeInfo.channelConfig?.translateAudio
      ? await translate(
          programmeInfo.channelLanguage,
          programmeInfo.episodeName
        )
      : programmeInfo.episodeName,
    showName: programmeInfo.channelConfig?.translateAudio
      ? await translate(programmeInfo.channelLanguage, programmeInfo.showName)
      : programmeInfo.showName,
  };

  const template = Handlebars.compile(text);
  const ttsText = decodeHTMLSpecialCharacters(template(programmeInfoCopy));

  const resultPath = await createAudioFile(
    ttsText,
    outputFile,
    programmeInfo.channelLanguage
  );

  console.log(`Successfully generated audio and saved it into ${resultPath}`);

  return resultPath;
};
