// services/m3uParser.ts

export interface Channel {
  id: string;
  name: string;
  logo: string;
  group: string;
  streamUrl: string;
}

export interface GroupedChannels {
  [category: string]: Channel[];
}

export const parseM3U = (rawM3uString: string): GroupedChannels => {
  const lines = rawM3uString.split('\n');
  const groups: GroupedChannels = {};
  let currentMetadata: Partial<Channel> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Catch any variation of #EXTINF (case-insensitive)
    if (line.toUpperCase().startsWith('#EXTINF')) {
      // Safely extract the display name after the last comma
      const commaIndex = line.lastIndexOf(',');
      const displayName = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : 'Live Channel';

      // Flexible attribute matching (handles optional spaces and case variation)
      const idMatch = line.match(/tvg-id="([^"]+)"/i);
      const nameMatch = line.match(/tvg-name="([^"]+)"/i);
      const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
      const groupMatch = line.match(/group-title="([^"]+)"/i);
      
      currentMetadata = {
        id: idMatch ? idMatch[1] : `ch-${Math.random().toString(36).substring(2, 9)}`,
        name: nameMatch ? nameMatch[1] : displayName,
        logo: logoMatch ? logoMatch[1] : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=200', // fall-back card cover
        group: groupMatch ? groupMatch[1].trim() : 'Live TV Channels', // default fallback swimlane
      };
    } 
    // Catch the streaming payload link line directly following metadata
    else if (line.startsWith('http') && currentMetadata) {
      const channel: Channel = {
        ...currentMetadata,
        streamUrl: line,
      } as Channel;

      const category = channel.group;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(channel);
      
      currentMetadata = null; // Reset for next target
    }
  }

  return groups;
};