import nodeHtmlToImage from "node-html-to-image";
import * as fs from "fs/promises";
import { ProgrammeInfo } from "./types";
import { translate } from "./translate";

export async function generateImage(
  videoWidth: number,
  videoHeight: number,
  next: string,
  programmeInfo: ProgrammeInfo
): Promise<string> {
  const imagePath = "./image.png";

  const programmeInfoCopy: ProgrammeInfo = {
    ...programmeInfo,
    episodeName: programmeInfo.channelConfig?.translateImage
      ? await translate(
          programmeInfo.channelLanguage,
          programmeInfo.episodeName
        )
      : programmeInfo.episodeName,
    showName: programmeInfo.channelConfig?.translateImage
      ? await translate(programmeInfo.channelLanguage, programmeInfo.showName)
      : programmeInfo.showName,
  };

  await nodeHtmlToImage({
    output: imagePath,
    html: await fs.readFile("image.html", "utf-8"),
    transparent: true,
    content: {
      width: videoWidth,
      height: videoHeight,
      next,
      ...programmeInfoCopy,
    },
    puppeteerArgs: {
      args: ["--no-sandbox"],
    },
  });

  console.log(`Successfully generated image for ${programmeInfo.channelName}`);

  return imagePath;
}
