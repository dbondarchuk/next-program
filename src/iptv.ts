import { Xmltv, XmltvProgramme, parseXmltv } from "@iptv/xmltv";
import { GlobalConfig } from "./config.types";
import { ProgrammeInfo } from "./types";
import { decodeHTMLSpecialCharacters } from "./utils";

const getXmltv = async (url: string) => {
  const result = await fetch(url);
  const xml = await result.text();

  const xmltv = parseXmltv(xml);

  return xmltv;
};

const getCurrentProgramme = async (xmltv: Xmltv, channelId: string) => {
  const programmes = xmltv.programmes?.filter(
    (programme) => programme.channel === channelId
  );

  if (!programmes) {
    throw new Error(`Can't find programmes for channel ${channelId}`);
  }

  const programme = programmes
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .filter(
      (programme) =>
        !programme.stop ||
        programme.stop.getTime() - Date.now() >= 5 * 60 * 1000
    )[0];

  if (!programme) {
    throw new Error(
      `Can't find programme to generate video for channel ${channelId}`
    );
  }

  return programme;
};

export const getCurrentProgrammes = async (config: GlobalConfig) => {
  const xmltv = await getXmltv(config.xmltvUrl);
  const programmes: ProgrammeInfo[] = [];

  for (let channel of xmltv.channels || []) {
    if (channel.displayName.length < 3) {
      console.error(`Can't get enough channel names for channel ${channel.id}`);
      continue;
    }

    const channelNumber: string = channel.displayName[1]._value;
    const channelName: string = decodeHTMLSpecialCharacters(
      channel.displayName[2]._value
    );

    const channelConfig =
      config.channels?.[channelNumber] || config.channels?.[channelName];
    if (channelConfig?.disabled) {
      console.log(`Skipping channel ${channelName} as it is disable in config`);
      continue;
    }

    let programme: XmltvProgramme;
    try {
      programme = await getCurrentProgramme(xmltv, channel.id);
    } catch (e) {
      console.error(`Failed to get programme for channel ${channelName}: ${e}`);
      continue;
    }

    const episodeNum =
      programme.episodeNum?.find((e) => e.system === "onscreen")?._value ||
      programme.episodeNum?.[0]?._value ||
      "";

    let season: number | string;
    let episode: number | string;
    try {
      const seasonMatcher = episodeNum.match(/S(\d+)E(\d+)/) || "";
      season = parseInt(seasonMatcher?.[1] || "0") || 0;
      episode = parseInt(seasonMatcher?.[2] || "0") || 0;
    } catch (e) {
      console.log(
        `Failed to parse season and episode for show ${programme.title}: ${programme.episodeNum} for channel ${channelName}: ${e}`
      );
      season = "?";
      episode = "?";
    }

    const channelLanguage = channelConfig?.language || "en";

    const showName = decodeHTMLSpecialCharacters(
      programme.title.find((t) => t.lang === channelLanguage)?._value ||
        programme.title[0]._value
    );
    const episodeName = decodeHTMLSpecialCharacters(
      programme.subTitle
        ? programme.subTitle.find((t) => t.lang === channelLanguage)?._value ||
            programme.subTitle[0]._value
        : showName
    );

    programmes.push({
      channelName,
      channelNumber,
      channelLanguage,
      showName,
      episodeName,
      season,
      episode,
      episodeNum,
      channelConfig,
    });
  }

  return programmes;
};
