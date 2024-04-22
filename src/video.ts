import * as path from "path";
import * as fs from "fs/promises";
import { existsSync } from "fs";
import ffmpeg, { FfprobeData, ffprobe } from "fluent-ffmpeg";
import { generateImage } from "./image";
import { GlobalConfig } from "./config.types";
import { ProgrammeInfo } from "./types";
import { getVoiceOverAudio } from "./audio";
import { findFile } from "./files";

function randomIntFromInterval(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function getVideoData(video: string): Promise<FfprobeData> {
  return new Promise((resolve, reject) =>
    ffprobe(video, (err, data) => {
      if (!!err) reject(err);
      resolve(data);
    })
  );
}

export async function generateVideo(
  config: GlobalConfig,
  programmeInfo: ProgrammeInfo
): Promise<string> {
  const resultVideoFolder = path.join(
    config.outputDirectory,
    programmeInfo.channelName
  );
  const videoPath = path.join(resultVideoFolder, "next.mp4");

  if (!existsSync(resultVideoFolder)) {
    await fs.mkdir(resultVideoFolder, { recursive: true });
  }

  const file = await findFile(config, programmeInfo);
  if (!file) {
    throw new Error(
      `Failed to find a video file for show ${programmeInfo.showName}, season ${programmeInfo.season}, ${programmeInfo.episode} (episodeNum: ${programmeInfo.episodeNum})`
    );
  }

  const videoData = await getVideoData(file);

  const videoSize = {
    // width: videoData.streams[0]?.width || 0,
    // height: videoData.streams[0]?.height || 0,
    width: config.video.width,
    height: config.video.height,
    ar: videoData.streams[0]?.display_aspect_ratio || 0,
  };

  console.log(videoSize);

  let command = ffmpeg();
  for (let i = 0; i < config.parts; i++) {
    const start = randomIntFromInterval(
      0,
      (videoData.format.duration || 0) * 0.8
    );
    command = command
      .input(file)
      .seekInput(start)
      .inputOption(`-to ${start + config.partLength}`);
  }

  const image = await generateImage(
    videoSize.width,
    videoSize.height,
    programmeInfo.channelConfig?.nextText || config.nextText,
    programmeInfo
  );

  command = command.input(image);

  let audioFilePath: string | undefined = undefined;
  if (
    programmeInfo.channelConfig?.enableAudio !== false &&
    (config.enableAudio || programmeInfo.channelConfig?.enableAudio)
  ) {
    audioFilePath = await getVoiceOverAudio(
      programmeInfo,
      programmeInfo.channelConfig?.audioText || config.audioText
    );
    command = command.input(audioFilePath);
  }

  const indexes = Array(config.parts)
    .fill(0)
    .map((_, index) => index);

  const totalTime = config.partLength * config.parts;

  // const setAspectRatioFilter = `setdar=${videoSize.ar
  //   .toString()
  //   .replace(":", "/")},`;
  const setAspectRatioFilter = "";
  command = command.complexFilter(
    [
      ...indexes.map(
        (index) =>
          `[${index}]${setAspectRatioFilter}scale=${videoSize.width}:${videoSize.height}[v${index}]`
      ),
      `${indexes.map((index) => `[v${index}]`).join("")}concat=n=${
        indexes.length
      }:v=1[vcon]`,
      `[${indexes.length}]scale=${videoSize.width / 2}:${
        videoSize.height / 4
      }[vovrl]`,
      `[vcon][vovrl]overlay=x=0:y=(main_h-overlay_h)[v];[v]setpts=1*PTS,fade=in:st=0:d=0.5,fade=out:st=${
        totalTime - 0.5
      }:d=0.5[vout]`,
      //`[${indexes.length + 1}:a]amix[aout]`,
    ],
    ["vout"]
  );

  command = command.addOptions("-map_chapters", "-1", "-map_metadata", "-1");

  if (audioFilePath) {
    command = command.addOptions("-map", `${indexes.length + 1}:a`);
  }

  command = command.videoCodec("libx264");

  console.log(command._getArguments());

  return new Promise((resolve, reject) => {
    command
      .on("error", (e) => reject(e))
      .on("end", () => {
        console.log("Successfully created a file");
        resolve(videoPath);
      })
      .on("progress", function (progress) {
        console.log("Processing: " + progress.percent + "% done");
      })
      .on("stdout", function (stdoutLine) {
        console.log(stdoutLine);
      })
      .on("stderr", function (stderrLine) {
        console.error(stderrLine);
      })
      .saveToFile(videoPath);
  });
}
