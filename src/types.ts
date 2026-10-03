export type ReportType = 'emergency' | 'daily' | 'event';
export type SeverityLevel = 'critical' | 'warning' | 'info' | 'positive';
export type ReportStatus = 'active' | 'investigating' | 'resolved';

export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  isAuthority?: boolean;
  imageUrl?: string;
}

export interface GroundedPlace {
  title: string;
  uri: string;
  address?: string;
  snippet?: string;
}

export interface ReportItem {
  id: string;
  type: ReportType;
  category: string;
  title: string;
  description: string;
  locationName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  distanceKm?: number;
  severity: SeverityLevel;
  status: ReportStatus;
  author: {
    name: string;
    badge: string;
    isVerifiedResident: boolean;
  };
  createdAt: string;
  updatedAt: string;
  votes: {
    up: number;
    down: number;
  };
  userVote?: 'up' | 'down';
  verificationsCount: number;
  userVerified?: boolean;
  commentsCount: number;
  comments: Comment[];
  tags: string[];
  imageUrl?: string;
  priceLevel?: string;
  directionsUrl?: string;
  reviewsAggregation?: PlaceReviewAggregation;
  eventDetails?: {
    date: string;
    time: string;
    attendeesCount: number;
    userRsvp?: boolean;
    locationVenue?: string;
  };
  groundedPlaces?: GroundedPlace[];
}

export interface NotificationLog {
  id: string;
  reportId: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  distanceKm: number;
  severity: string;
  read?: boolean;
}

export interface UserLocation {
  lat: number;
  lng: number;
  name: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  places?: GroundedPlace[];
  recommendedPlaces?: GooglePlaceResult[];
}

export interface PlatformReviewSummary {
  rating: number;
  reviewCount?: number;
  platform: 'google' | 'yelp' | 'rednote';
  summary: string;
  highlights: string[];
  sentiment: 'positive' | 'very_positive' | 'neutral' | 'mixed';
}

export interface PlaceReviewAggregation {
  placeId: string;
  placeName: string;
  address?: string;
  cuisineOrCategory?: string;
  priceLevel?: string;
  overallConsensusScore: number;
  consensusSummary: string;
  mustTryOrHighlights: string[];
  bestTimeToVisit?: string;
  googleReviews: PlatformReviewSummary;
  yelpReviews: PlatformReviewSummary;
  rednoteReviews: PlatformReviewSummary & {
    trendingTags: string[];
    photoWorthinessScore?: number;
  };
}

export interface GooglePlaceResult {
  id: string;
  name: string;
  address: string;
  category: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  distanceKm?: number;
  priceLevel?: string;
  rating?: number;
  imageUrl?: string;
  reviewsAggregation?: PlaceReviewAggregation;
  directionsUrl?: string;
  isSituationReport?: boolean;
  reportItem?: ReportItem;
}
