/** Row of the `vwCars` view. */
export interface Car {
  id: number;
  /** Ad number: YYYYMMDD + 4 random digits. */
  code: string | null;
  user_id: number;
  /** Dealer the ad belongs to; null = a person's / the admin's own ad. */
  dealer_id: number | null;
  brand_id: number;
  car_model_id: number | null;
  body_type_id: number | null;
  location_id: number | null;
  manufactured_year: number | null;
  imported_year: number | null;
  price: number | string | null;
  mileage: number | null;
  fuel_type: string | null;
  transmission: string | null;
  drive_type: string | null;
  steering: string | null;
  engine_capacity: string | number | null;
  color: string | null;
  /** Салоны өнгө. */
  interior_color: string | null;
  vin: string | null;
  phonenumber: string | null;
  description: string | null;
  view_count: number | null;
  is_featured: boolean | number | null;
  sold_at: string | null;
  /** Admin's note when the ad was returned (status "rejected"). */
  reject_reason?: string | null;
  rejected_at?: string | null;
  status: string;
  created_at: string | null;
  updated_at: string | null;

  name: string | null;
  brand_name: string | null;
  brand_logo: string | null;
  model_name: string | null;
  body_type_name: string | null;
  location_name: string | null;
  seller_name: string | null;
  seller_phone: string | null;
  dealer_name: string | null;
  dealer_logo: string | null;
  image: string | null;
  image_count: number | null;
  favorite_count: number | null;
}

export interface Brand {
  id: number;
  name: string;
  country: string | null;
  logo: string | null;
  sort_order: number | null;
  model_count?: number;
  car_count?: number;
}

export interface CarModel {
  id: number;
  brand_id: number;
  name: string;
  status?: string | null;
}

export interface BodyType {
  id: number;
  name: string;
  image: string | null;
  sort_order: number | null;
  car_count?: number;
}

export interface Location {
  id: number;
  name: string;
  sort_order?: number | null;
}

export interface CarFile {
  id: number;
  data_id: number;
  generated_name: string | null;
  original_name: string | null;
  order: number | null;
}

export interface User {
  id: number;
  phonenumber: string | null;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  role: string | null;
  /** Profile photo file name (uploads/users). */
  profile: string | null;
  /** Dealer the user works for; only ADMIN / DEALER users have one. */
  dealer_id: number | null;
  status?: string | null;
  created_at?: string | null;
}

/** Web visitor account (`customers` table): signs in with a one-time code, saves ads, chats. */
export interface Customer {
  id: number;
  phonenumber: string | null;
  email: string | null;
  firstname: string | null;
  lastname: string | null;
  profile: string | null;
  status: "active" | "inactive" | "deleted";
  created_at: string | null;
  last_login_at: string | null;
}

/** Dealer (car showroom) registry row; users and ads point at it by `dealer_id`. */
export interface Dealer {
  id: number;
  name: string;
  /** File name in uploads/dealers. */
  logo: string | null;
  phonenumber: string | null;
  email: string | null;
  address: string | null;
  description: string | null;
  status: "active" | "inactive" | "deleted";
  created_at?: string | null;
}

/** Visitor message from the web chat box. */
export interface Message {
  id: number;
  name: string | null;
  phonenumber: string;
  message: string;
  car_id: number | null;
  page_url: string | null;
  status: "new" | "done";
  created_at: string | null;
}
