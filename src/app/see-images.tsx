import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/ChunkyButton';
import { Dots } from '@/components/Dots';
import { IdeaChips, type Idea } from '@/components/IdeaChips';
import { ImageViewer, type ViewerItem } from '@/components/ImageViewer';
import { Mochi } from '@/components/Mochi';
import { SegmentedToggle } from '@/components/SegmentedToggle';
import { colors, fonts, radius, TAP_TARGET } from '@/constants/theme';
import { errorMessage, generatePicture, searchPhotos, type Photo, type Picture } from '@/lib/api';

type Mode = 'find' | 'make';

const MAX_LENGTH = 100; // the server allows up to 100 characters

const SEARCH_IDEAS: Idea[] = [
  { emoji: '🐶', label: 'Animals', value: 'cute animals' },
  { emoji: '🌈', label: 'Rainbow', value: 'rainbow' },
  { emoji: '🚀', label: 'Space', value: 'space planets' },
  { emoji: '🌸', label: 'Flowers', value: 'flowers' },
  { emoji: '🐠', label: 'Ocean', value: 'ocean fish' },
];

const DRAW_IDEAS: Idea[] = [
  { emoji: '🐱', label: 'Cat with a kite', value: 'a cat flying a kite' },
  { emoji: '🐘', label: 'Elephant party', value: 'a baby elephant at a birthday party' },
  { emoji: '🦖', label: 'Dino picnic', value: 'a friendly dinosaur having a picnic' },
  { emoji: '🐻', label: 'Bear in space', value: 'a teddy bear astronaut on the moon' },
];

export default function SeeImagesScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('find');
  const [viewerItem, setViewerItem] = useState<ViewerItem | null>(null);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
        {/* Banner, like the sign-up screen */}
        <View style={styles.banner}>
          <Pressable
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back_ios_new', web: 'arrow_back_ios_new' }}
              size={20}
              tintColor={colors.text}
            />
          </Pressable>
          <Dots
            dots={[
              { size: 11, color: colors.yellow, left: 150, top: 14 },
              { size: 8, color: colors.green, left: 196, bottom: 14 },
            ]}
          />
          <Text style={styles.title}>See Images</Text>
          <Mochi size={88} style={styles.mochi} />
        </View>

        <SegmentedToggle
          value={mode}
          onChange={setMode}
          options={[
            { value: 'find', label: 'Find photos' },
            { value: 'make', label: 'Make a picture' },
          ]}
        />

        {/* Both modes stay mounted, so switching back keeps your results. */}
        <View style={[styles.flex, mode !== 'find' && styles.hidden]}>
          <FindPhotos onOpen={(photo) => setViewerItem({ kind: 'photo', photo })} bottomInset={insets.bottom} />
        </View>
        <View style={[styles.flex, mode !== 'make' && styles.hidden]}>
          <MakePicture
            onOpen={(picture) => setViewerItem({ kind: 'picture', picture })}
            bottomInset={insets.bottom}
          />
        </View>
      </View>

      <ImageViewer item={viewerItem} onClose={() => setViewerItem(null)} />
    </KeyboardAvoidingView>
  );
}

// ---------- Find photos (Unsplash) ----------

function FindPhotos({ onOpen, bottomInset }: { onOpen: (photo: Photo) => void; bottomInset: number }) {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(''); // the query the results belong to
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setQuery(q);
    setLoading(true);
    setError(null);
    try {
      const result = await searchPhotos(q, 1);
      setPhotos(result.photos);
      setHasMore(result.hasMore);
      setPage(1);
      setSearched(q);
    } catch (err) {
      setPhotos([]);
      setSearched('');
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loading || loadingMore || !searched) return;
    setLoadingMore(true);
    try {
      const result = await searchPhotos(searched, page + 1);
      // Skip any photo we already have (Unsplash pages can overlap).
      setPhotos((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...result.photos.filter((p) => !seen.has(p.id))];
      });
      setHasMore(result.hasMore);
      setPage((p) => p + 1);
    } catch {
      setHasMore(false); // stop trying; the photos we have stay on screen
    } finally {
      setLoadingMore(false);
    }
  };

  const header = (
    <View style={styles.controls}>
      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => runSearch(query)}
          placeholder="Puppies, rainbows, trains…"
          placeholderTextColor={colors.border}
          returnKeyType="search"
          maxLength={MAX_LENGTH}
          autoCorrect
          accessibilityLabel="What would you like to see?"
          style={styles.searchInput}
        />
        <Pressable
          onPress={() => runSearch(query)}
          accessibilityRole="button"
          accessibilityLabel="Search"
          style={styles.searchButton}
        >
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            size={22}
            tintColor={colors.surface}
          />
        </Pressable>
      </View>
      <IdeaChips ideas={SEARCH_IDEAS} onPick={(idea) => runSearch(idea.value)} disabled={loading} />
    </View>
  );

  let empty: ReactNode;
  if (loading) empty = <StatusMessage loading text="Mochi is looking…" />;
  else if (error) empty = <StatusMessage text={error} />;
  else if (searched) empty = <StatusMessage text="No photos found. Try another word!" />;
  else empty = <StatusMessage text="What would you like to see?" />;

  return (
    <FlatList
      data={loading ? [] : photos}
      keyExtractor={(p) => p.id}
      numColumns={2}
      columnWrapperStyle={styles.gridRow}
      contentContainerStyle={[styles.gridContent, { paddingBottom: bottomInset + 24 }]}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={styles.more} /> : undefined}
      onEndReached={loadMore}
      onEndReachedThreshold={0.6}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onOpen(item)}
          accessibilityRole="imagebutton"
          accessibilityLabel={item.alt || 'Photo'}
          style={styles.gridItem}
        >
          <Image
            source={{ uri: item.url }}
            style={[styles.gridImage, { backgroundColor: item.color }]}
            contentFit="cover"
            transition={200}
          />
        </Pressable>
      )}
    />
  );
}

// ---------- Make a picture (Gemini) ----------

function MakePicture({ onOpen, bottomInset }: { onOpen: (picture: Picture) => void; bottomInset: number }) {
  const [prompt, setPrompt] = useState('');
  const [picture, setPicture] = useState<Picture | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draw = async (text: string) => {
    const p = text.trim();
    if (!p || drawing) return;
    setPrompt(p);
    setDrawing(true);
    setError(null);
    try {
      setPicture(await generatePicture(p));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDrawing(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.makeContent, { paddingBottom: bottomInset + 24 }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <View style={styles.fieldBlock}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>What should Mochi draw?</Text>
          <Text style={styles.counter}>
            {prompt.length}/{MAX_LENGTH}
          </Text>
        </View>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="A cat flying a kite"
          placeholderTextColor={colors.border}
          maxLength={MAX_LENGTH}
          multiline
          editable={!drawing}
          accessibilityLabel="What should Mochi draw?"
          style={styles.promptInput}
        />
      </View>

      <IdeaChips ideas={DRAW_IDEAS} onPick={(idea) => draw(idea.value)} disabled={drawing} />

      <ChunkyButton
        label={drawing ? 'Mochi is drawing…' : 'Make my picture'}
        variant="fun"
        height={56}
        onPress={() => draw(prompt)}
        icon={
          drawing ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <SymbolView
              name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
              size={20}
              tintColor={colors.text}
            />
          )
        }
      />

      {error && <StatusMessage text={error} />}

      {drawing && <StatusMessage loading text="Drawing takes a few seconds. Mochi is working hard!" />}

      {picture && !drawing && (
        <Pressable
          onPress={() => onOpen(picture)}
          accessibilityRole="imagebutton"
          accessibilityLabel="Your picture. Tap to see it big and save it."
          style={styles.pictureCard}
        >
          <Image
            source={{ uri: `data:${picture.mimeType};base64,${picture.imageBase64}` }}
            style={styles.picture}
            contentFit="cover"
          />
          <Text style={styles.pictureHint}>Tap to see it big and save it</Text>
        </Pressable>
      )}

      {!picture && !drawing && !error && (
        <StatusMessage text="Type an idea or tap one above, then press Make my picture!" />
      )}
    </ScrollView>
  );
}

// ---------- Shared ----------

function StatusMessage({ text, loading }: { text: string; loading?: boolean }) {
  return (
    <View style={styles.status}>
      {loading ? <ActivityIndicator size="large" color={colors.primary} /> : <Mochi size={120} />}
      <Text style={styles.statusText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    gap: 14,
  },
  banner: {
    height: 88,
    borderRadius: 28,
    backgroundColor: colors.skySoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 14,
    paddingRight: 8,
    overflow: 'hidden',
  },
  backButton: {
    width: TAP_TARGET,
    height: TAP_TARGET,
    borderRadius: TAP_TARGET / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: fonts.heading,
    fontSize: 26,
    lineHeight: 34,
    color: colors.text,
  },
  mochi: {
    marginTop: 8,
  },

  // Find photos
  controls: {
    gap: 12,
    paddingBottom: 14,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 54,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    fontFamily: fonts.body,
    fontSize: 17,
    color: colors.text,
  },
  searchButton: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContent: {
    paddingTop: 2,
  },
  gridRow: {
    gap: 12,
    marginBottom: 12,
  },
  gridItem: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  more: {
    marginVertical: 16,
  },

  // Make a picture
  makeContent: {
    gap: 14,
  },
  fieldBlock: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 15,
    color: colors.text,
  },
  counter: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textMuted,
  },
  promptInput: {
    minHeight: 84,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontFamily: fonts.body,
    fontSize: 17,
    color: colors.text,
    textAlignVertical: 'top',
  },
  pictureCard: {
    borderRadius: radius.xxl,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.yellow,
    padding: 10,
    gap: 10,
  },
  picture: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.lg,
  },
  pictureHint: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 15,
    color: colors.primary,
    textAlign: 'center',
    paddingBottom: 4,
  },

  // Shared
  status: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  statusText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
