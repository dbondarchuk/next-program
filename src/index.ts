import { getConfig } from "./config";
import { GlobalConfig } from "./config.types";
import { getCurrentProgrammes } from "./iptv";
import { generateVideo } from "./video";

const job = async (config: GlobalConfig) => {
  console.log(`Getting current programmes from ${config.xmltvUrl}...`);
  const currentProgrammes = await getCurrentProgrammes(config);
  console.log(`Found ${currentProgrammes.length} programmes`);

  for (let programme of currentProgrammes) {
    console.log(`Generating video for channel ${programme.channelName}`);

    try {
      const resultPath = await generateVideo(config, programme);
      console.log(
        `Successfully generated video for channel ${programme.channelName} and saved it into ${resultPath}`
      );
    } catch (e) {
      console.error(
        `Failed to generate video for channel ${programme.channelName}: ${e}`
      );
    }
  }
};

(async () => {
  const repeatJob = async (config: GlobalConfig) => {
    const intervalJob = async () => {
      await job(config);
      console.log("Sleeping for 5 minutes");
    };

    await intervalJob();

    return await new Promise(() => {
      setInterval(intervalJob, 5 * 60 * 1000);
    });
  };

  const config = await getConfig(process.argv[2]);

  await repeatJob(config);
})();
