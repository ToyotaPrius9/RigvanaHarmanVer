// pages/NotificationsPage.js
import React, { useState, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MainLayout from "../components/MainLayout";
import { useNavigation } from "@react-navigation/native";
import { GLOBAL_URL } from "../ipconfig";
import { getToken } from '../utils/auth';

export default function NotificationsPage() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${GLOBAL_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch notifications");

      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      Alert.alert("Error", "Failed to load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = await getToken();
      await fetch(`${GLOBAL_URL}/notifications/${notificationId}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Update local state to mark as read
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleNotificationPress = (notification) => {
    // Mark as read when pressed
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case "new_follower":
        navigation.navigate("OtherProfile", { userId: notification.sender_uid });
        break;
      case "new_comment":
      case "new_thread":
      case "new_tweet":
      case "post_like":
        navigation.navigate("DiscussionPage", { 
          post: { id: notification.object_id } 
        });
        break;
      default:
        // Default action or do nothing
        break;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#9fcfff" />
        </View>
      </MainLayout>
    );
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case "new_follower":
        return "person-add-outline";
      case "new_comment":
        return "chatbubble-outline";
      case "post_like":
        return "heart-outline";
      case "new_thread":
      case "new_tweet":
        return "document-text-outline";
      default:
        return "notifications-outline";
    }
  };

  const getNotificationTitle = (type) => {
    switch (type) {
      case "new_follower":
        return "New Follower";
      case "new_comment":
        return "New Comment";
      case "post_like":
        return "Post Liked";
      case "new_thread":
        return "New Thread";
      case "new_tweet":
        return "New Tweet";
      default:
        return "Notification";
    }
  };

  return (
    <MainLayout>
      <ScrollView 
        className="flex-1 px-4 py-6 bg-[#161010]"
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={["#9fcfff"]} 
            tintColor="#9fcfff" 
          />
        }
      >
        <View className="flex-row gap-2">
          <Pressable onPress={() => navigation.navigate("MainTabs", { screen: "Forum" })}>
            <Ionicons name="arrow-back-outline" color={"white"} size={24}/>
          </Pressable>
          
          <Text className="text-white text-lg font-helvetica-bold mb-4 mt-0.5">
            Notifications
          </Text>
        </View>

        {notifications.length === 0 && !loading && (
          <View className="p-4 bg-neutral-800 rounded-lg">
            <Text className="text-gray-400">You have no new notifications.</Text>
          </View>
        )}

        {notifications.map((n) => (
          <Pressable
            key={n.id}
            onPress={() => handleNotificationPress(n)}
            className={`bg-neutral-800 p-4 rounded-xl mb-4 ${!n.is_read ? "border-l-4 border-[#9fcfff]" : ""}`}
          >
            <View className="flex-row items-center mb-2">
              {n.sender_image && (
                <Image 
                  source={{ uri: n.sender_image }} 
                  className="w-8 h-8 rounded-full mr-2"
                />
              )}
              <Ionicons
                name={getNotificationIcon(n.type)}
                size={20}
                color="#9fcfff"
              />
              <Text className="text-white font-helvetica-bold text-base ml-2">
                {getNotificationTitle(n.type)}
              </Text>
              {!n.is_read && (
                <View className="ml-2 w-2 h-2 rounded-full bg-[#9fcfff]" />
              )}
            </View>

            <Text className="text-gray-400 font-helvetica text-sm leading-tight">
              {n.message}
            </Text>

            {n.metadata?.post_preview && (
              <Text className="text-gray-500 text-xs mt-1 italic">
                {n.metadata.post_preview}
              </Text>
            )}

            <Text className="text-gray-500 text-xs mt-2">
              {new Date(n.created_at).toLocaleString()}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </MainLayout>
  );
}