import { Post } from '../components/PostCard';
import { Timestamp } from 'firebase/firestore';

export const DEMO_POSTS: Post[] = [
  {
    id: 'demo-1',
    authorUid: 'demo-user-1',
    authorName: 'আহমেদ হাসান',
    authorAvatarUrl: 'https://picsum.photos/seed/user1/100/100',
    content: 'আসসালামু আলাইকুম! আজকের দিনটি সবার জন্য বরকতময় হোক। আলহামদুলিল্লাহ।',
    type: 'ইসলামিক উপদেশ',
    createdAt: Timestamp.now(),
    ameenCount: 12,
    reactionsCount: 45,
    reportsCount: 0
  },
  {
    id: 'demo-2',
    authorUid: 'demo-user-2',
    authorName: 'ফাতিমা জোহরা',
    authorAvatarUrl: 'https://picsum.photos/seed/user2/100/100',
    content: 'কুরআন তিলাওয়াত করলে মন শান্ত হয়। সুবহানাল্লাহ।',
    type: 'কুরআনের আয়াত',
    createdAt: Timestamp.now(),
    ameenCount: 25,
    reactionsCount: 89,
    reportsCount: 0
  },
  {
    id: 'demo-3',
    authorUid: 'demo-user-3',
    authorName: 'মোহাম্মদ আলী',
    authorAvatarUrl: 'https://picsum.photos/seed/user3/100/100',
    content: 'নামাজ কায়েম করুন, এটিই সফলতার চাবিকাঠি।',
    type: 'ইসলামিক উপদেশ',
    createdAt: Timestamp.now(),
    ameenCount: 40,
    reactionsCount: 120,
    reportsCount: 0
  },
  {
    id: 'demo-4',
    authorUid: 'demo-user-4',
    authorName: 'সাদিয়া ইসলাম',
    authorAvatarUrl: 'https://picsum.photos/seed/user4/100/100',
    content: 'সবর করুন, আল্লাহ সবরকারীদের সাথে আছেন। ইনশাআল্লাহ।',
    type: 'ইসলামিক উপদেশ',
    createdAt: Timestamp.now(),
    ameenCount: 18,
    reactionsCount: 67,
    reportsCount: 0
  },
  {
    id: 'demo-5',
    authorUid: 'demo-user-5',
    authorName: 'আব্দুল্লাহ আল মামুন',
    authorAvatarUrl: 'https://picsum.photos/seed/user5/100/100',
    content: 'মা-বাবার সেবা করুন, জান্নাত আপনার পায়ের নিচে।',
    type: 'ইসলামিক উপদেশ',
    createdAt: Timestamp.now(),
    ameenCount: 55,
    reactionsCount: 210,
    reportsCount: 0
  },
  {
    id: 'demo-6',
    authorUid: 'demo-user-6',
    authorName: 'রাইসা রহমান',
    authorAvatarUrl: 'https://picsum.photos/seed/user6/100/100',
    content: 'দান-সদকা বিপদমুক্ত রাখে। আল্লাহ আমাদের তৌফিক দিন।',
    type: 'ইসলামিক উপদেশ',
    createdAt: Timestamp.now(),
    ameenCount: 30,
    reactionsCount: 95,
    reportsCount: 0
  },
  {
    id: 'demo-7',
    authorUid: 'demo-user-7',
    authorName: 'জুবায়ের আহমেদ',
    authorAvatarUrl: 'https://picsum.photos/seed/user7/100/100',
    content: 'হজরত মুহাম্মদ (সা.) এর সুন্নাহ মেনে চলাই প্রকৃত সফলতা।',
    type: 'হাদিস',
    createdAt: Timestamp.now(),
    ameenCount: 48,
    reactionsCount: 156,
    reportsCount: 0
  },
  {
    id: 'demo-8',
    authorUid: 'demo-user-8',
    authorName: 'নুসরাত জাহান',
    authorAvatarUrl: 'https://picsum.photos/seed/user8/100/100',
    content: 'দোয়া ইবাদতের মগজ। বেশি বেশি দোয়া করুন।',
    type: 'দোয়া চাই',
    createdAt: Timestamp.now(),
    ameenCount: 22,
    reactionsCount: 78,
    reportsCount: 0
  },
  {
    id: 'demo-9',
    authorUid: 'demo-user-9',
    authorName: 'তানভীর আহমেদ',
    authorAvatarUrl: 'https://picsum.photos/seed/user9/100/100',
    content: 'পরনিন্দা থেকে দূরে থাকুন, এটি ঈমান নষ্ট করে।',
    type: 'ইসলামিক উপদেশ',
    createdAt: Timestamp.now(),
    ameenCount: 15,
    reactionsCount: 54,
    reportsCount: 0
  },
  {
    id: 'demo-10',
    authorUid: 'demo-user-10',
    authorName: 'মারিয়া আক্তার',
    authorAvatarUrl: 'https://picsum.photos/seed/user10/100/100',
    content: 'আল্লাহর ওপর ভরসা রাখুন, তিনি আপনার জন্য যথেষ্ট।',
    type: 'ইসলামিক উপদেশ',
    createdAt: Timestamp.now(),
    ameenCount: 37,
    reactionsCount: 112,
    reportsCount: 0
  }
];
