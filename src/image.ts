import nodeHtmlToImage from "node-html-to-image";
import * as fs from "fs/promises";
import { ProgrammeInfo } from "./types";

export async function generateImage(
  videoWidth: number,
  videoHeight: number,
  next: string,
  programmeInfo: ProgrammeInfo
): Promise<string> {
  const imagePath = "./image.png";

  await nodeHtmlToImage({
    output: imagePath,
    html: await fs.readFile("image.html", "utf-8"),
    transparent: true,
    content: {
      width: videoWidth,
      height: videoHeight,
      next,
      ...programmeInfo,
    },
    puppeteerArgs: {
      args: ["--no-sandbox"],
    },
  });

  return imagePath;
}
