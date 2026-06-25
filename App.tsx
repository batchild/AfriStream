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

// ✅ FIXED: Full, absolute direct path to your raw Dropbox M3U asset file
const M3U_PLAYLIST_URL = "https://dropboxusercontent.com";

export default function App() {
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [groupedChannels, setGroupedChannels] = useState<GroupedChannels>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // State to toggle the global header menu dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadPlaylist() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        // Pass the clean static URL string directly into fetch
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

      {/* FLOATING DROPDOWN OVERLAY */}
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
                    setIsDropdownOpen(false);
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

      {/* Video Viewport */}
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
                    setIsDropdownOpen(false);
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
    position: 'relative',
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
    zIndex: 101,
  },
  logoText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  logoAccent: { color: '#E50914' },
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
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  dropdownContainer: { position: 'absolute', top: 60, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 100, padding: 16 },
  dropdownTitle: { color: '#999999', fontSize: 14, marginBottom: 10 },
  dropdownList: { flex: 1 },
  dropdownItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  dropdownItemCurrent: { backgroundColor: '#111111' },
  dropdownItemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dropdownItemText: { color: '#CCCCCC', fontSize: 16 },
  dropdownItemTextCurrent: { color: '#E50914', fontWeight: 'bold' },
  playingIndicator: { color: '#E50914', fontSize: 12, fontWeight: 'bold' },
  dropdownItemSub: { color: '#666666', fontSize: 12 },
  playerSection: { height: 240, backgroundColor: '#000000' },
  centeredState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  stateText: { color: '#999999', marginTop: 15, fontSize: 16 },
  errorTitle: { color: '#E50914', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  errorSubText: { color: '#666666', fontSize: 14, textAlign: 'center' },
  browserContainer: { flex: 1 },
  tabBarWrapper: { height: 50, backgroundColor: '#000000' },
  tabBarContent: { alignItems: 'center', paddingHorizontal: 8 },
  tabButton: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderRadius: 20, backgroundColor: '#1A1A1A' },
  activeTabButton: { backgroundColor: '#E50914' },
  tabText: { color: '#999999', fontSize: 14, fontWeight: '600' },
  activeTabText: { color: '#FFFFFF' },
  gridRow: { justifyContent: 'space-between', paddingHorizontal: 12 },
  listContent: { paddingVertical: 12 },
  cardWrapper: { flex: 0.48, marginBottom: 12 },
  emptyText: { color: '#666666', textAlign: 'center', marginTop: 40, fontSize: 16 }
});
