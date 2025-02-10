import React, { useState } from 'react';
import { Download, ImageIcon, Sparkles, Send, Loader2, AlertCircle } from 'lucide-react';


interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
}

const samplePrompts = [
  "A cyberpunk city at night with neon signs and flying cars",
  "A magical library with floating books and glowing crystals",
  "An ancient temple overgrown with bioluminescent plants",
  "A steampunk laboratory with brass machines and tesla coils",
  "An underwater city with crystal domes and sea creatures"
];

function App() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_STABILITY_API_KEY}`,
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt,
              weight: 1
            }
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          steps: 30,
          samples: 1
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: `data:image/png;base64,${responseData.artifacts[0].base64}`,
        prompt: prompt
      };
      
      setGeneratedImages(prev => [newImage, ...prev]);
      setPrompt('');
    } catch (err) {
      setError('Failed to generate image. Please check your API key and try again.');
      console.error('Error generating image:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-generated-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading image:', err);
      alert('Failed to download image. Please try again.');
    }
  };

  const handleSuggestPrompt = () => {
    const randomPrompt = samplePrompts[Math.floor(Math.random() * samplePrompts.length)];
    setPrompt(randomPrompt);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <ImageIcon className="w-12 h-12 text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
            AI Image Generator
          </h1>
          <p className="text-gray-400">Transform your imagination into stunning visuals using Stable Diffusion XL</p>
        </header>

        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate in detail..."
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white resize-none h-24"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && prompt.trim()) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />
              <button
                onClick={handleSuggestPrompt}
                className="absolute right-3 top-3 text-gray-400 hover:text-purple-400 transition-colors"
                title="Suggest prompt"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-400">
                Press Enter to generate, Shift + Enter for new line
              </p>
              <button
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim()}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                Generate
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-4 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {generatedImages.map((image) => (
            <div key={image.id} className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden">
              <div className="aspect-square relative group">
                <img
                  src={image.url}
                  alt={image.prompt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => handleDownload(image.url)}
                    className="p-3 bg-white rounded-full hover:bg-gray-200 transition-colors transform hover:scale-110"
                    title="Download image"
                  >
                    <Download className="w-6 h-6 text-gray-900" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-400">{image.prompt}</p>
              </div>
            </div>
          ))}
        </div>

        {generatedImages.length === 0 && !isLoading && (
          <div className="text-center text-gray-400 mt-12">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No images generated yet. Start by entering a prompt above!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;