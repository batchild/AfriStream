// components/ChannelCard.tsx
import React from 'react';
import { StyleSheet, Text, Image, TouchableOpacity, View } from 'react-native';
import { Channel } from '../services/m3uParser';

interface Props {
  channel: Channel;
  onSelect: (channel: Channel) => void;
  isActive: boolean;
}

export const ChannelCard = ({ channel, onSelect, isActive }: Props) => {
  // Verifies if a safe image link is present
  const hasValidLogo = channel.logo && channel.logo.trim().startsWith('http');

  return (
    <TouchableOpacity 
      style={[styles.card, isActive && styles.activeCard]} 
      onPress={() => onSelect(channel)}
    >
      {hasValidLogo ? (
        <Image 
          source={{ uri: channel.logo }} 
          style={styles.logo} 
          resizeMode="contain" 
        />
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            {channel.name.substring(0, 2).toUpperCase()}
          </Text>
        </View>
      )}
      
      <View style={styles.overlay}>
        <Text style={styles.channelName} numberOfLines={1}>
          {channel.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: '#141414',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCard: {
    borderColor: '#E50914',
  },
  logo: {
    width: '90%',
    height: '70%',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#E50914',
    fontSize: 28,
    fontWeight: '900',
    opacity: 0.8,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  channelName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});