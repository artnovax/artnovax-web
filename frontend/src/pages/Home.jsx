import React from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import MissionBand from "../components/MissionBand";
import WhatWeDo from "../components/WhatWeDo";
import Footer from "../components/Footer";

const Home = () => {
  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/" />
      <main>
        <Hero />
        <MissionBand />
        <WhatWeDo />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
