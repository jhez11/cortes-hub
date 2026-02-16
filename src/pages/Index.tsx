import { HeroHeader } from "@/components/HeroHeader";
import { QuickServices } from "@/components/QuickServices";
import { RequestStatusCard } from "@/components/RequestStatusCard";
import { AnnouncementsFeed } from "@/components/AnnouncementsFeed";
import { BottomNav } from "@/components/BottomNav";
import { WeatherAdvisory } from "@/components/WeatherAdvisory";
import { useState } from "react";

const Index = () => {
  const [showWeather, setShowWeather] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <div className="app-container pb-24">
        {/* Real-time Weather Advisory from PAG-ASA */}
        {showWeather && (
          <WeatherAdvisory onDismiss={() => setShowWeather(false)} />
        )}

        {/* Hero Header */}
        <HeroHeader />

        {/* Main Content */}
        <main className="space-y-6 pt-2">
          {/* Quick Services Grid */}
          <QuickServices />

          {/* Request Status */}
          <RequestStatusCard />

          {/* Announcements */}
          <AnnouncementsFeed />
        </main>
      </div>

      {/* Bottom Navigation - Full width */}
      <BottomNav />
    </div>
  );
};

export default Index;
