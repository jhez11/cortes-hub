import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Cloud, 
  CloudRain, 
  CloudLightning, 
  Sun,
  Wind,
  Droplets,
  Thermometer,
  X,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface WeatherData {
  location: string;
  advisory: string;
  temperature: string;
  condition: string;
  humidity: string;
  windSpeed: string;
  rainfall: string;
  lastUpdated: string;
  source: string;
}

const conditionIcons: Record<string, React.ElementType> = {
  'Clear Sky': Sun,
  'Mainly Clear': Sun,
  'Partly Cloudy': Cloud,
  'Cloudy': Cloud,
  'Overcast': Cloud,
  'Rainy': CloudRain,
  'Slight Rain': CloudRain,
  'Moderate Rain': CloudRain,
  'Heavy Rain': CloudRain,
  'Thunderstorms': CloudLightning,
  'Thunderstorm': CloudLightning,
};

interface WeatherAdvisoryProps {
  onDismiss?: () => void;
}

export const WeatherAdvisory = ({ onDismiss }: WeatherAdvisoryProps) => {
  const { data: weather, isLoading, error, refetch, isFetching } = useQuery<WeatherData>({
    queryKey: ['pagasa-weather'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('pagasa-weather');
      if (error) throw error;
      return data;
    },
    refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
    staleTime: 1000 * 60 * 15, // Consider data stale after 15 minutes
  });

  if (isLoading) {
    return (
      <Card className="mx-4 mt-4 border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="animate-pulse h-10 w-10 bg-primary/20 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="animate-pulse h-4 w-32 bg-primary/20 rounded" />
              <div className="animate-pulse h-3 w-48 bg-primary/10 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return null;
  }

  const WeatherIcon = conditionIcons[weather.condition] || Cloud;
  const hasWarning = weather.advisory.includes('⚠️') || 
                     weather.advisory.toLowerCase().includes('warning') ||
                     weather.advisory.toLowerCase().includes('thunderstorm');

  return (
    <Card className={cn(
      "mx-4 mt-4 border overflow-hidden transition-all",
      hasWarning 
        ? "border-warning/50 bg-gradient-to-r from-warning/15 to-warning/5" 
        : "border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5"
    )}>
      <CardContent className="px-3 py-2.5">
        {/* Compact single-row layout */}
        <div className="flex items-center gap-2">
          {hasWarning ? (
            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
          ) : (
            <WeatherIcon className="h-4 w-4 text-primary shrink-0" />
          )}

          {/* Weather stats inline */}
          <div className="flex items-center gap-3 flex-1 min-w-0 text-xs">
            <span className="font-medium truncate">{weather.condition}</span>
            <span className="flex items-center gap-0.5 shrink-0">
              <Thermometer className="h-3 w-3 text-muted-foreground" />
              {weather.temperature}
            </span>
            <span className="flex items-center gap-0.5 shrink-0">
              <Droplets className="h-3 w-3 text-muted-foreground" />
              {weather.humidity}
            </span>
            <span className="hidden sm:flex items-center gap-0.5 shrink-0">
              <Wind className="h-3 w-3 text-muted-foreground" />
              {weather.windSpeed}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn("h-3 w-3", isFetching && "animate-spin")} />
            </Button>
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onDismiss}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Advisory text - only show if warning */}
        {hasWarning && (
          <p className="text-xs mt-1.5 p-1.5 rounded bg-warning/10 text-warning-foreground line-clamp-1">
            {weather.advisory}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
