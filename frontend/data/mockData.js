// ============================================================
// DateSpark — Mock Data Layer
// All UI screens pull from this central data file.
// Replace with API calls when backend integration is ready.
// ============================================================

// --- Usage Limits ---
export const usageLimits = {
  builder: { used: 0, max: 2, label: 'Builder' },
  ai: { used: 0, max: 2, label: 'AI' },
  swaps: { used: 0, max: 3, label: 'Swaps' },
  favSaves: { used: 0, max: 3, label: 'Fav Saves' },
};

// --- User Profile ---
export const userProfile = {
  name: '',
  fullName: 'Alex Johnson',
  avatar: null, // placeholder — will use initials
  membership: 'Premium Member',
  streak: 7,
  weekDays: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  streakDays: [true, true, true, true, false, false, false],
};

// --- Recent Activity ---
export const recentActivity = [
  { icon: 'heart', text: 'Saved a new favorite', time: '2h ago', color: '#FF6B8A' },
  { icon: 'sparkles', text: 'Created a new plan', time: '5h ago', color: '#8B5CF6' },
  { icon: 'repeat', text: 'Used a swap', time: '1d ago', color: '#06B6D4' },
  { icon: 'star', text: 'Completed a plan', time: '2d ago', color: '#F59E0B' },
];

// --- Continue Planning ---
export const continuePlanning = {
  id: 'plan-1',
  title: 'The Ultimate Chill Experience 🏙️',
  location: 'Manhattan, NY',
  image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80',
  status: 'IN PROGRESS',
};

// --- Your Date Plans ---
export const datePlans = [
  {
    id: 'plan-2',
    title: 'Rooftop Sunset & Vibes',
    location: 'Brooklyn, NY',
    status: 'Planned',
    image: 'https://images.unsplash.com/photo-1470219556762-1fd5b28f3261?w=200&q=80',
  },
  {
    id: 'plan-3',
    title: 'Museum & Coffee Date',
    location: 'Manhattan, NY',
    status: 'Completed',
    image: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=200&q=80',
  },
  {
    id: 'plan-4',
    title: 'Beach Day Escape',
    location: 'Long Beach, NY',
    status: 'Draft',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&q=80',
  },
];

// --- Discover Inspiration Categories ---
export const discoverCategories = [
  { label: 'Classic Romance', count: 24, image: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=300&q=80' },
  { label: 'Adventurous', count: 18, image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=300&q=80' },
  { label: 'Chill & Cozy', count: 32, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&q=80' },
  { label: 'Foodie Dates', count: 27, image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&q=80' },
];

// --- Filter Chips ---
export const filterChips = ['Trending', 'Hidden Places', 'Romantic', 'Adventure', 'Foodie'];

// --- Hidden Places ---
export const hiddenPlaces = [
  {
    id: 'hp-1',
    name: 'The Garden Courtyard',
    neighborhood: 'West Village',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&q=80',
  },
  {
    id: 'hp-2',
    name: 'Mulberry Street Books',
    neighborhood: 'Nolita',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&q=80',
  },
  {
    id: 'hp-3',
    name: 'Rooftop at Arlo SoHo',
    neighborhood: 'SoHo',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
  },
];

// --- Discovery Feed Cards ---
export const discoveryCards = [
  {
    id: 'disc-1',
    category: 'Trending',
    location: 'Manhattan, NY',
    title: 'Classic Romance Date',
    description: 'A timeless evening with stunning views, candlelit dinner, and rooftop drinks.',
    image: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=600&q=80',
    saves: 342,
  },
  {
    id: 'disc-2',
    category: 'Adventure',
    location: 'Brooklyn, NY',
    title: 'Brooklyn Bridge & Beyond',
    description: 'Walk the iconic bridge at sunset, then explore DUMBO\'s hidden spots.',
    image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80',
    saves: 218,
  },
];

// --- Builder Stepper ---
export const builderSteps = [
  { number: 1, label: 'Where & When', icon: 'map-pin' },
  { number: 2, label: 'Vibe & Budget', icon: 'heart' },
  { number: 3, label: 'Interests', icon: 'sparkles' },
  { number: 4, label: 'Preferences', icon: 'sliders' },
  { number: 5, label: 'Review', icon: 'check-circle' },
];

// --- AI Concept Cards ---
export const aiConcepts = [
  {
    id: 'ai-1',
    title: 'Romantic Escape',
    description: 'Intimate spots, dreamy vibes, unforgettable moments.',
    icon: 'heart',
    color: '#FF6B8A',
    bgColor: '#FFF0F3',
    badge: 'Best for anniversaries',
    badgeColor: '#FF6B8A',
  },
  {
    id: 'ai-2',
    title: 'Fun & Adventurous',
    description: 'Exciting activities, unique experiences, non-stop fun.',
    icon: 'zap',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    badge: 'High energy',
    badgeColor: '#F59E0B',
  },
  {
    id: 'ai-3',
    title: 'Hidden Local Gems',
    description: 'Underrated places, local favorites, off the beaten path.',
    icon: 'gem',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    badge: 'Authentic & unique',
    badgeColor: '#8B5CF6',
  },
  {
    id: 'ai-4',
    title: 'Chill & Relaxed',
    description: 'Laid-back spots, great conversations, low-key vibes.',
    icon: 'coffee',
    color: '#06B6D4',
    bgColor: '#ECFEFF',
    badge: 'Relax & unwind',
    badgeColor: '#06B6D4',
  },
  {
    id: 'ai-5',
    title: 'Classic Date Night',
    description: 'Timeless date ideas that never go out of style.',
    icon: 'wine',
    color: '#EC4899',
    bgColor: '#FDF2F8',
    badge: 'Always a good choice',
    badgeColor: '#EC4899',
  },
  {
    id: 'ai-6',
    title: 'Surprise Me',
    description: 'Let AI plan something amazing based on your preferences.',
    icon: 'sparkles',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    badge: 'Fully personalized',
    badgeColor: '#3B82F6',
  },
];

// --- Generated Plan: Classic Romance ---
export const classicRomancePlan = {
  id: 'gen-romance',
  title: 'Classic Romance Date 💖',
  location: 'Manhattan, New York',
  timeRange: '6:00 PM – 11:30 PM',
  pills: ['Romantic', 'Relaxed Pace', 'Mid-range'],
  description: 'A timeless date plan with beautiful views, great conversation, and unforgettable moments.',
  heroImage: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80',
  stats: {
    stops: 5,
    miles: '~4.2',
    avgRating: 4.8,
    totalReviews: '298.7k+',
  },
  theme: 'romance', // 'romance' | 'adventure'
  stops: [
    {
      id: 'stop-r1',
      time: '6:00 PM',
      category: 'START HERE',
      name: 'Central Park',
      subtitle: 'Quiet Park',
      description: 'Step into the magic of this top-tier spot. Perfect for your chill date!',
      rating: 4.8,
      reviews: '298.7k+',
      duration: '45 min',
      image: 'https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=400&q=80',
      icon: 'trees',
      iconColor: '#22C55E',
      iconBg: '#DCFCE7',
    },
    {
      id: 'stop-r2',
      time: '7:00 PM',
      category: 'CULTURE',
      name: 'The Metropolitan Museum of Art',
      subtitle: null,
      description: 'Explore world-class art and timeless exhibits together.',
      rating: 4.7,
      reviews: '88.2k+',
      duration: '1h 30m',
      image: 'https://images.unsplash.com/photo-1575223970966-76ae61ee7838?w=400&q=80',
      icon: 'landmark',
      iconColor: '#8B5CF6',
      iconBg: '#F3E8FF',
    },
    {
      id: 'stop-r3',
      time: '8:30 PM',
      category: 'DINNER',
      name: 'The Loeb Boathouse',
      subtitle: null,
      description: 'Romantic waterfront dining with stunning views.',
      rating: 4.6,
      reviews: '12.9k+',
      duration: '1h 15m',
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
      icon: 'utensils-crossed',
      iconColor: '#F59E0B',
      iconBg: '#FEF3C7',
    },
    {
      id: 'stop-r4',
      time: '10:00 PM',
      category: 'DRINKS',
      name: '230 Fifth Rooftop Bar',
      subtitle: null,
      description: 'End the night with skyline views and great vibes.',
      rating: 4.5,
      reviews: '9.1k+',
      duration: '1h 30m',
      image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&q=80',
      icon: 'wine',
      iconColor: '#EC4899',
      iconBg: '#FCE7F3',
    },
    {
      id: 'stop-r5',
      time: '11:30 PM',
      category: 'ENDING',
      name: 'Stroll & Goodbyes',
      subtitle: null,
      description: 'Take a peaceful walk to end the perfect night.',
      rating: null,
      reviews: null,
      duration: null,
      image: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=400&q=80',
      icon: 'heart',
      iconColor: '#FF6B8A',
      iconBg: '#FFF0F3',
    },
  ],
};

// --- Generated Plan: Adventure Escape ---
export const adventureEscapePlan = {
  id: 'gen-adventure',
  title: 'Adventure Escape 🏔️',
  location: 'Lake Tahoe, California',
  timeRange: '8:00 AM – 8:00 PM',
  pills: ['Adventure', 'Active Pace', 'Budget-friendly'],
  description: 'An epic outdoor day filled with breathtaking views, hiking, and lakeside magic.',
  heroImage: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80',
  stats: {
    stops: 6,
    miles: '~12.5',
    avgRating: 4.7,
    totalReviews: '45.2k+',
  },
  theme: 'adventure',
  stops: [
    {
      id: 'stop-a1',
      time: '8:00 AM',
      category: 'START HERE',
      name: 'Emerald Bay Lookout',
      subtitle: 'Scenic Vista',
      description: 'Start the day with jaw-dropping panoramic lake views.',
      rating: 4.9,
      reviews: '15.3k+',
      duration: '30 min',
      image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&q=80',
      icon: 'mountain',
      iconColor: '#059669',
      iconBg: '#D1FAE5',
    },
    {
      id: 'stop-a2',
      time: '9:00 AM',
      category: 'HIKING',
      name: 'Eagle Falls Trail',
      subtitle: null,
      description: 'A moderate hike to a stunning waterfall with lake views.',
      rating: 4.8,
      reviews: '8.7k+',
      duration: '1h 30m',
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80',
      icon: 'footprints',
      iconColor: '#059669',
      iconBg: '#D1FAE5',
    },
    {
      id: 'stop-a3',
      time: '11:00 AM',
      category: 'BEACH',
      name: 'Sand Harbor Beach',
      subtitle: null,
      description: 'Crystal-clear waters and smooth boulders — perfect for a swim break.',
      rating: 4.7,
      reviews: '12.1k+',
      duration: '2h',
      image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&q=80',
      icon: 'waves',
      iconColor: '#0EA5E9',
      iconBg: '#E0F2FE',
    },
    {
      id: 'stop-a4',
      time: '1:30 PM',
      category: 'LUNCH',
      name: 'Lone Eagle Grille',
      subtitle: null,
      description: 'Lakeside dining with mountain views and fresh cuisine.',
      rating: 4.6,
      reviews: '5.4k+',
      duration: '1h 15m',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
      icon: 'utensils-crossed',
      iconColor: '#F59E0B',
      iconBg: '#FEF3C7',
    },
    {
      id: 'stop-a5',
      time: '3:30 PM',
      category: 'ACTIVITY',
      name: 'Kayak on the Lake',
      subtitle: null,
      description: 'Paddle through turquoise waters with mountain reflections.',
      rating: 4.8,
      reviews: '3.2k+',
      duration: '2h',
      image: 'https://images.unsplash.com/photo-1472745942893-4b9f730c7668?w=400&q=80',
      icon: 'ship',
      iconColor: '#06B6D4',
      iconBg: '#CFFAFE',
    },
    {
      id: 'stop-a6',
      time: '6:00 PM',
      category: 'SUNSET',
      name: 'Sunset at Cave Rock',
      subtitle: null,
      description: 'Watch the sun dip behind the Sierra Nevadas — pure magic.',
      rating: 4.9,
      reviews: '6.5k+',
      duration: '2h',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',
      icon: 'sunset',
      iconColor: '#F97316',
      iconBg: '#FFF7ED',
    },
  ],
};

// --- Pricing Plans ---
export const pricingPlans = [
  {
    id: 'free',
    name: 'FREE',
    price: 0,
    tagline: 'Try the magic',
    features: [
      '3 AI-generated plans / week',
      '2 custom builds / day',
      '3 swaps per plan',
      'Limited Hidden Places access',
      'Save up to 5 plans',
      'Basic map + directions',
    ],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    id: 'plus',
    name: 'PLUS',
    price: 9.99,
    tagline: 'Better dates, less thinking',
    features: [
      'Unlimited AI plans',
      'Unlimited swaps',
      'Full access to Hidden Places',
      'Smart re-optimization',
      'Save unlimited plans',
      'Priority results',
      'No usage cooldowns',
    ],
    cta: 'Upgrade Your Dates',
    popular: true,
  },
  {
    id: 'premium',
    name: 'PREMIUM',
    price: 19.99,
    tagline: 'Elite experiences',
    features: [
      'Everything in Plus',
      '"Surprise Me" AI mode',
      'Exclusive / hard-to-find spots',
      'Date personalization memory',
      'Multi-date planning (trips)',
      'Early access to new features',
      'Priority support',
    ],
    cta: 'Unlock Premium',
    popular: false,
  },
];
