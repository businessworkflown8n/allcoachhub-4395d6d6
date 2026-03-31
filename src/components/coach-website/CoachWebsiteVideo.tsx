import { Play } from "lucide-react";

interface Props {
  videoUrl: string;
  themeColor: string;
}

const CoachWebsiteVideo = ({ videoUrl, themeColor }: Props) => (
  <section className="border-b border-border py-14">
    <div className="container mx-auto px-4">
      <h2 className="mb-6 text-center text-2xl font-bold text-foreground">
        <Play className="mr-2 inline h-5 w-5" style={{ color: themeColor }} /> Introduction
      </h2>
      <div className="mx-auto max-w-3xl">
        <iframe
          src={videoUrl.replace("watch?v=", "embed/")}
          className="aspect-video w-full rounded-xl border border-border"
          allowFullScreen
          title="Intro video"
        />
      </div>
    </div>
  </section>
);

export default CoachWebsiteVideo;
