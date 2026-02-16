import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/BottomNav';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, MapPin, Image as ImageIcon, Loader2 } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type TouristSpot = Tables<'tourist_spots'>;

const TouristSpots = () => {
  const navigate = useNavigate();
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<TouristSpot | null>(null);

  useEffect(() => {
    fetchSpots();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('tourist_spots_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tourist_spots' },
        () => fetchSpots()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSpots = async () => {
    const { data } = await supabase
      .from('tourist_spots')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (data) setSpots(data);
    setIsLoading(false);
  };

  if (selectedSpot) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="app-container">
          {/* Header with image */}
          <div className="relative h-72">
            {selectedSpot.images && selectedSpot.images.length > 0 ? (
              <img
                src={selectedSpot.images[0]}
                alt={selectedSpot.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <ImageIcon className="h-16 w-16 text-primary/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <button
              onClick={() => setSelectedSpot(null)}
              className="absolute top-4 left-4 flex items-center gap-2 text-white bg-black/30 backdrop-blur-sm px-3 py-2 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="text-white text-2xl font-bold mb-1">{selectedSpot.title}</h1>
              {selectedSpot.municipality && (
                <p className="text-white/80 text-sm flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {selectedSpot.municipality}
                </p>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-6 space-y-6">
            <Card variant="elevated">
              <CardContent className="p-4">
                <h2 className="font-semibold mb-2">About</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {selectedSpot.description}
                </p>
              </CardContent>
            </Card>

            {selectedSpot.location && (
              <Card variant="elevated">
                <CardContent className="p-4">
                  <h2 className="font-semibold mb-2">Location</h2>
                  <p className="text-muted-foreground text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {selectedSpot.location}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Image Gallery */}
            {selectedSpot.images && selectedSpot.images.length > 1 && (
              <div className="space-y-3">
                <h2 className="font-semibold">Gallery</h2>
                <div className="grid grid-cols-2 gap-2">
                  {selectedSpot.images.slice(1).map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${selectedSpot.title} ${idx + 2}`}
                      className="w-full h-32 object-cover rounded-xl"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="app-container">
        {/* Header */}
        <div className="hero-gradient px-4 pt-12 pb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">Tourist Spots</h1>
              <p className="text-white/70 text-sm">Discover Surigao del Sur</p>
            </div>
          </div>
        </div>

        {/* Curved transition */}
        <div className="h-6 bg-background rounded-t-3xl -mt-6 relative z-10" />

        {/* Content */}
        <div className="px-4 -mt-2 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : spots.length === 0 ? (
            <Card variant="elevated">
              <CardContent className="p-8 text-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No tourist spots available yet</p>
              </CardContent>
            </Card>
          ) : (
            spots.map((spot, index) => (
              <Card
                key={spot.id}
                variant="elevated"
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => setSelectedSpot(spot)}
              >
                <div className="relative h-40">
                  {spot.images && spot.images.length > 0 ? (
                    <img
                      src={spot.images[0]}
                      alt={spot.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-primary/30" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1">{spot.title}</h3>
                  {spot.municipality && (
                    <p className="text-muted-foreground text-sm flex items-center gap-1 mb-2">
                      <MapPin className="h-3 w-3" />
                      {spot.municipality}
                    </p>
                  )}
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {spot.description}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default TouristSpots;
