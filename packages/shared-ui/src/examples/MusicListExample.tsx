/**
 * Example usage of MusicList component with pagination
 * This demonstrates how to integrate the optimized MusicList component
 */
import React, { useState } from 'react';
import { MusicList } from '../components/MusicList';
import type { MusicTrack } from '@super-son1k/shared-types';

export function MusicListExample() {
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);

  const handleTrackSelect = (track: MusicTrack) => {
    setSelectedTrack(track);
    console.log('Selected track:', track);
  };

  const handleTrackDownload = (track: MusicTrack) => {
    if (track.audioUrl) {
      // Create download link
      const link = document.createElement('a');
      link.href = track.audioUrl;
      link.download = `${track.title || 'track'}.mp3`;
      link.click();
    }
  };

  const handleTrackUpload = (track: MusicTrack) => {
    // Handle upload to external service
    console.log('Upload track:', track);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0b0d] via-[#0f121a] to-[#0b0b0d] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Mis Creaciones</h1>
        
        <MusicList
          userId="user-123" // Replace with actual user ID
          pageSize={10}
          variant="detailed"
          onTrackSelect={handleTrackSelect}
          onTrackDownload={handleTrackDownload}
          onTrackUpload={handleTrackUpload}
          selectedTrackId={selectedTrack?.id}
          showLoadMore={true}
          emptyMessage="Aún no has generado música. ¡Comienza a crear!"
        />

        {selectedTrack && (
          <div className="mt-8 p-4 bg-white/5 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Track Seleccionado</h3>
            <p className="text-sm text-white/70">{selectedTrack.prompt}</p>
            {selectedTrack.audioUrl && (
              <audio controls className="w-full mt-4" src={selectedTrack.audioUrl} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}


