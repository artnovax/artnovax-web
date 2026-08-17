import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import MissionBand from "../components/MissionBand";
import WhatWeDo from "../components/WhatWeDo";
import Footer from "../components/Footer";
import { defaultHomePageContent, getHomePageContent } from "../services/pageContent";

const Home = () => {
  const [content, setContent] = useState(() => defaultHomePageContent());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const remoteContent = await getHomePageContent();
        if (!cancelled) setContent(remoteContent);
      } catch (error) {
        console.warn("Using built-in homepage content.", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/" />
      <main>
        <Hero data={content.hero} />
        <MissionBand data={content.mission} />
        <WhatWeDo data={content.whatWeDo} />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
