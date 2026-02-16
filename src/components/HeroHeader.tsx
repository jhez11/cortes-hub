import { useNavigate } from 'react-router-dom';
import { Bell, Search, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import heroImage from "@/assets/hero-coastal.jpg";

export const HeroHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={heroImage} alt="Cortes coastal view" className="w-full h-full object-cover" />
        <div className="absolute inset-0 hero-gradient opacity-85" />
      </div>

      <div className="relative z-10 px-4 pt-12 pb-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-xs font-medium">Municipality of</p>
              <h1 className="text-white text-lg font-bold tracking-tight">Cortes</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 relative" onClick={() => navigate('/updates')}>
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-accent rounded-full" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate(user ? '/profile' : '/auth')}>
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-white/80 text-sm mb-1">Magandang hapon,</p>
          <h2 className="text-white text-2xl font-bold mb-2">Welcome to myCortes!</h2>
          <p className="text-white/70 text-sm leading-relaxed">Your digital gateway to municipal services</p>
        </div>

        <Button variant="accent" size="lg" className="w-full" onClick={() => navigate('/request-service')}>
          <span>Report an Issue</span>
        </Button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-6 bg-background rounded-t-3xl" />
    </header>
  );
};
