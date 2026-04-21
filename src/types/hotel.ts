// ─── Hotel Types ──────────────────────────────────────────────────────────────

export interface Hotel {
  id: string;
  name: string;
  location: string;
  pricePerNight: number;
  minDays: number;
  rating: number;
  image: string;
  imageAlt: string;
  halalTags: string[];
  active: boolean;
  bonusEligible: boolean;
  commission: string;
}

export interface HotelFormData {
  name: string;
  location: string;
  pricePerNight: string;
  minDays: string;
  rating: string;
  image: string;
  imageAlt: string;
  halalTags: string;
  active: boolean;
  bonusEligible: boolean;
  commission: string;
}
