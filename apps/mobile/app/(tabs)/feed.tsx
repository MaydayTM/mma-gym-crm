import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MOCK_POSTS = [
  {
    id: '1',
    author: 'kevin',
    gym: 'Reconnect Academy',
    caption: 'Armbar setup vanuit closed guard',
    likes: 24,
    comments: 3,
  },
  {
    id: '2',
    author: 'sarah',
    gym: 'Alliance BJJ',
    caption: 'Loop choke details - werkt elke keer!',
    likes: 156,
    comments: 12,
  },
  {
    id: '3',
    author: 'mehdi',
    gym: 'Reconnect Academy',
    caption: 'Knee slice pass fundamentals',
    likes: 89,
    comments: 7,
  },
];

export default function FeedScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>FightFlow</Text>
        <TouchableOpacity style={styles.postButton}>
          <Ionicons name="add" size={24} color="#D4AF37" />
        </TouchableOpacity>
      </View>

      {/* Feed */}
      <ScrollView style={styles.feed}>
        {MOCK_POSTS.map((post) => (
          <View key={post.id} style={styles.postCard}>
            {/* Post header */}
            <View style={styles.postHeader}>
              <View style={styles.authorAvatar}>
                <Ionicons name="person" size={20} color="#D4AF37" />
              </View>
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>@{post.author}</Text>
                <Text style={styles.authorGym}>{post.gym}</Text>
              </View>
            </View>

            {/* Video placeholder */}
            <View style={styles.videoPlaceholder}>
              <Ionicons name="play-circle" size={60} color="#fff" />
              <Text style={styles.videoText}>YouTube Short</Text>
              <Text style={styles.videoSubtext}>15 sec video</Text>
            </View>

            {/* Caption */}
            <Text style={styles.caption}>{post.caption}</Text>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="heart-outline" size={22} color="#fff" />
                <Text style={styles.actionText}>{post.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                <Text style={styles.actionText}>{post.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-outline" size={22} color="#fff" />
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  postButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feed: {
    flex: 1,
  },
  postCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    padding: 15,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  authorGym: {
    color: '#666',
    fontSize: 12,
  },
  videoPlaceholder: {
    height: 400,
    backgroundColor: '#111',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  videoText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  videoSubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  caption: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: '#888',
    fontSize: 14,
  },
});
