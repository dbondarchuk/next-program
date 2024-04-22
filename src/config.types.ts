export type ChannelConfig = {
  disabled?: boolean;
  enableAudio?: boolean;
  language?: string;
  nextText?: string;
  audioText?: string;
  translateImage?: boolean;
  translateAudio?: boolean;
};

export type GlobalConfig = {
  inputDirectory: string;
  outputDirectory: string;
  xmltvUrl: string;
  nextText: string;
  enableAudio: boolean;
  audioText: string;
  video: {
    width: number;
    height: number;
  };

  parts: number;
  partLength: number;

  channels?: Record<string, ChannelConfig>;
};
