// App.tsx
import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { parseM3U, GroupedChannels, Channel } from './services/m3uParser';
import { StreamPlayer } from './components/StreamPlayer';
import { ChannelCard } from './components/ChannelCard';

const M3U_PLAYLIST_URL = "https://www.dropbox.com/scl/fi/6ka99mk91x4zcem19n02g/my-iptv-channels-3.m3u?rlkey=ww17sugg48blq9r6mtlaenbue&st=rap29g3p&dl=1"; 

export default function App() {
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [groupedChannels, setGroupedChannels] = useState<GroupedChannels>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // 💡 State to toggle the global header menu dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadPlaylist() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const response = await fetch(M3U_PLAYLIST_URL);
        if (!response.ok) {
          throw new Error(`Server returned HTTP status ${response.status}`);
        }

        const rawM3uText = await response.text();
        const parsedGroups = parseM3U(rawM3uText);

        const masterList: Channel[] = [];
        Object.keys(parsedGroups).forEach((cat) => {
          masterList.push(...parsedGroups[cat]);
        });

        if (masterList.length === 0) {
          throw new Error("No operational streams detected in file.");
        }

        setAllChannels(masterList);
        setGroupedChannels(parsedGroups);
        setCategories(['ALL', ...Object.keys(parsedGroups)]);

      } catch (error: any) {
        console.error(error);
        setErrorMessage(error.message || "Failed to resolve M3U payload.");
      } finally {
        setIsLoading(false);
      }
    }

    loadPlaylist();
  }, []);

  const activeChannelsToDisplay = selectedCategory === 'ALL' 
    ? allChannels 
    : groupedChannels[selectedCategory] || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Dynamic App Brand Header Row */}
      <View style={styles.header}>
        <Text style={styles.logoText}>AFRI<Text style={styles.logoAccent}>STREAM</Text></Text>
        
        {!isLoading && !errorMessage && (
          // 💡 TURNED BADGE INTO A CLICKABLE TOGGLE BUTTON
          <TouchableOpacity 
            style={[styles.badge, isDropdownOpen && styles.badgeActive]} 
            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
            activeOpacity={0.7}
          >
            <Text style={styles.badgeText}>
              {allChannels.length} CHANNELS {isDropdownOpen ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 💡 FLOATING DROPDOWN OVERLAY (Renders on top of the layout when active) */}
      {isDropdownOpen && !isLoading && (
        <View style={styles.dropdownContainer}>
          <Text style={styles.dropdownTitle}>Quick Switch Channel:</Text>
          <ScrollView style={styles.dropdownList} nestedScrollEnabled={true}>
            {allChannels.map((item, index) => {
              const isCurrent = selectedChannel?.streamUrl === item.streamUrl;
              return (
                <TouchableOpacity
                  key={item.id + index}
                  style={[styles.dropdownItem, isCurrent && styles.dropdownItemCurrent]}
                  onPress={() => {
                    setSelectedChannel(item);
                    setIsDropdownOpen(false); // Close menu automatically on selection
                  }}
                >
                  <View style={styles.dropdownItemRow}>
                    <Text style={[styles.dropdownItemText, isCurrent && styles.dropdownItemTextCurrent]}>
                      {item.name}
                    </Text>
                    {isCurrent && <Text style={styles.playingIndicator}>● PLAYING</Text>}
                  </View>
                  <Text style={styles.dropdownItemSub}>{item.group || 'General'}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Video Viewport: Mounts after clicking a channel */}
      {selectedChannel && (
        <View style={styles.playerSection}>
          <StreamPlayer activeChannel={selectedChannel} />
        </View>
      )}

      {isLoading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.stateText}>Synchronizing content stream grids...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centeredState}>
          <Text style={styles.errorTitle}>Configuration Error</Text>
          <Text style={styles.errorSubText}>{errorMessage}</Text>
        </View>
      ) : (
        <View style={styles.browserContainer}>
          
          {/* Horizontal Navigation Slider Menu */}
          <View style={styles.tabBarWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarContent}>
              {categories.map((category) => {
                const isActive = selectedCategory === category;
                return (
                  <TouchableOpacity
                    key={category}
                    style={[styles.tabButton, isActive && styles.activeTabButton]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text style={[styles.tabText, isActive && styles.activeTabText]}>{category}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Cross-Platform Stabilized 2-Column Grid */}
          <FlatList
            data={activeChannelsToDisplay}
            keyExtractor={(item, index) => item.id + index}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <ChannelCard
                  channel={item}
                  onSelect={(chan) => {
                    setSelectedChannel(chan);
                    setIsDropdownOpen(false); // Close dropdown if open when picking from main screen
                  }}
                  isActive={selectedChannel?.streamUrl === item.streamUrl}
                />
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No broadcasts categorized here.</Text>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0A0A0A',
    height: Platform.OS === 'web' ? '100vh' : '100%',
    position: 'relative', // Necessary to anchor absolute positioning layout child elements
  },
  header: { 
    height: 60, 
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 16, 
    backgroundColor: '#000000', 
    borderBottomWidth: 1, 
    borderColor: '#1A1A1A',
    zIndex: 101, // Stays in front of the floating layer menu container
  },
  logoText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  logoAccent: { color: '#E50914' },
  
  // Interactive Header Badge Dropdown Trigger Style
  badge: { 
    backgroundColor: '#1A1A1A', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#333333'
  },
  badgeActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914'
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  
  // 💡 SLEEK FLOATING DROPDOWN STYLING
  dropdownContainer: {
    position: 'absolute',
    top: 60, // Sits exactly flush under the header bar
    right: 16,
    width: 280,
    maxHeight: 350,
    backgroundColor: '#111111',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222222',
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.5)', // web native box shadow styling 
    zIndex: 1000, // Forces menu to float on top of video element window
    paddingVertical: 8,
  },
  dropdownTitle: {
    color: '#666666',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingBottom: 6,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderColor: '#1A1A1A',
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: '#1A1A1A',
  },
  dropdownItemCurrent: {
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
  },
  dropdownItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemText: {
    color: '#CCCCCC',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  dropdownItemTextCurrent: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  playingIndicator: {
    color: '#E50914',
    fontSize: 9,
    fontWeight: '900',
    marginLeft: 6,
  },
  dropdownItemSub: {
    color: '#555555',
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase',
  },

  playerSection: {
    width: '100%',
    backgroundColor: '#000000',
  },
  browserContainer: { 
    flex: 1, 
    width: '100%'
  },
  
  tabBarWrapper: { borderBottomWidth: 1, borderColor: '#1A1A1A', backgroundColor: '#000000' },
  tabBarContent: { paddingVertical: 12, paddingHorizontal: 8 },
  tabButton: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginRight: 8, backgroundColor: '#1A1A1A' },
  activeTabButton: { backgroundColor: '#E50914' },
  tabText: { color: '#AAAAAA', fontSize: 11, fontWeight: '700' },
  activeTabText: { color: '#FFFFFF' },

  listContent: { paddingHorizontal: 8, paddingTop: 12, paddingBottom: 40 },
  gridRow: { 
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12 
  },
  cardWrapper: {
    width: '48%',
    marginHorizontal: '1%',
    aspectRatio: 16 / 10,
  },
  
  centeredState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  stateText: { color: '#888888', marginTop: 12, fontSize: 13 },
  errorTitle: { color: '#E50914', fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  errorSubText: { color: '#FFFFFF', fontSize: 14, textAlign: 'center' },
  emptyText: { color: '#666666', textAlign: 'center', marginTop: 40, fontSize: 13 }
});
