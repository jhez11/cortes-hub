import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ScanSearch, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageAnalysisProps {
  imageUrl: string;
  className?: string;
}

interface AnalysisResult {
  isReal: boolean | null;
  confidence: number;
  analysis: string;
}

export const ImageAnalysis = ({ imageUrl, className }: ImageAnalysisProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyzeImage = async () => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      // Call Lovable AI for image analysis
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this image and determine if it appears to be AI-generated or a real photograph. Consider:
1. Unnatural details (extra fingers, distorted text, impossible shadows)
2. Texture consistency and lighting
3. Background coherence
4. Edge artifacts and blending issues

Respond in this exact JSON format:
{
  "isReal": true or false or null if uncertain,
  "confidence": number from 0 to 100,
  "analysis": "Brief 1-2 sentence explanation"
}`
                },
                {
                  type: 'image_url',
                  image_url: { url: imageUrl }
                }
              ]
            }
          ],
        }),
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      // Parse the JSON response
      try {
        const parsed = JSON.parse(content);
        setResult({
          isReal: parsed.isReal,
          confidence: parsed.confidence || 50,
          analysis: parsed.analysis || 'Unable to determine',
        });
      } catch {
        // If parsing fails, try to extract meaning from text
        const isReal = content.toLowerCase().includes('real') && !content.toLowerCase().includes('ai-generated');
        setResult({
          isReal: isReal ? true : content.toLowerCase().includes('ai') ? false : null,
          confidence: 50,
          analysis: content.slice(0, 200),
        });
      }
    } catch (error) {
      console.error('Image analysis error:', error);
      setResult({
        isReal: null,
        confidence: 0,
        analysis: 'Failed to analyze image. Please try again.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={analyzeImage}
        disabled={isAnalyzing}
        className="w-full"
      >
        {isAnalyzing ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <ScanSearch className="h-4 w-4 mr-2" />
        )}
        {isAnalyzing ? 'Analyzing...' : 'Verify Image Authenticity'}
      </Button>

      {result && (
        <Card className={cn(
          "border-2",
          result.isReal === true && "border-success bg-success/5",
          result.isReal === false && "border-warning bg-warning/5",
          result.isReal === null && "border-muted"
        )}>
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              {result.isReal === true && (
                <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
              )}
              {result.isReal === false && (
                <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              )}
              {result.isReal === null && (
                <HelpCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium text-sm">
                  {result.isReal === true && 'Likely Authentic Photo'}
                  {result.isReal === false && 'Possible AI-Generated Image'}
                  {result.isReal === null && 'Unable to Determine'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Confidence: {result.confidence}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {result.analysis}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
