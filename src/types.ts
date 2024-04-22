import { ChannelConfig } from "./config.types";

export type ProgrammeInfo = {
  channelNumber: string;
  channelName: string;
  channelLanguage: string;
  showName: string;
  episodeName: string;
  season: string | number;
  episode: string | number;
  episodeNum: string;
  channelConfig?: ChannelConfig;
};
