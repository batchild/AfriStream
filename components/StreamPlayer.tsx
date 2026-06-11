// components/StreamPlayer.tsx
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Channel } from '../services/m3uParser';

interface Props {
  activeChannel: Channel | null;
}

export const StreamPlayer = ({ activeChannel }: Props) => {
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);

  const currentStreamUrl = activeChannel?.streamUrl ?? '';

  const player = useVideoPlayer(currentStreamUrl, (playerInstance) => {
    playerInstance.loop = false;
    // Only autoplay natively on mobile hardware initialization
    if (Platform.OS !== 'web') {
      playerInstance.play();
    }
  });

  useEffect(() => {
    if (!player || !currentStreamUrl) return;

    player.replace(currentStreamUrl);

    if (Platform.OS === 'web') {
      // 💡 SILENCE FIX: Directly show the click overlay on web instead of 
      // triggering player.play() blindly and causing browser console errors.
      setIsAutoplayBlocked(true);
    } else {
      setIsAutoplayBlocked(false);
      player.play();
    }
  }, [currentStreamUrl, player]);

  if (!activeChannel) {
    return (
      <View style={[styles.playerContainer, styles.centered]}>
        <Text style={styles.placeholderText}>Select a channel below to go live</Text>
      </View>
    );
  }

  return (
    <View style={styles.playerContainer}>
      <View style={styles.videoWrapper}>
        <VideoView
          style={styles.videoPlayer}
          player={player}
          allowsFullscreen
          allowsPictureInPicture
          nativeControls
        />
        
        {/* Interactive Overlay Layer */}
        {isAutoplayBlocked && (
          <TouchableOpacity 
            style={styles.playbackOverlay} 
            onPress={() => {
              player.play();
              setIsAutoplayBlocked(false);
            }}
          >
            <View style={styles.playButton}>
              <Text style={styles.playButtonText}>▶ CLICK TO WATCH LIVE</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.metaContainer}>
        <View style={styles.liveIndicator}>
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <Text style={styles.streamTitle} numberOfLines={1}>
          {activeChannel.name} — {activeChannel.group}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  playerContainer: {
    width: '100%',
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderColor: '#222222',
  },
  videoWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  centered: {
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111111',
  },
  placeholderText: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '600',
  },
  playbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  playButton: {
    backgroundColor: '#E50914',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0A0A0A',
  },
  liveIndicator: {
    backgroundColor: '#E50914',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginRight: 8,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  streamTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
});