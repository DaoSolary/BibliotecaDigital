export type UserRole = "user" | "admin";
export type NotificationType = "new_book" | "comment_reply" | "system";
export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string | null;
  isbn: string | null;
  category_id: string | null;
  cover_url: string | null;
  pdf_url: string | null;
  year: number | null;
  language: string;
  page_count: number;
  download_allowed: boolean;
  is_featured: boolean;
  is_published: boolean;
  read_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  tags?: Tag[];
  avg_rating?: number;
  rating_count?: number;
  is_favorite?: boolean;
}

export interface Rating {
  id: string;
  book_id: string;
  user_id: string;
  score: number;
  is_approved: boolean;
  created_at: string;
  profile?: Profile;
}

export interface Comment {
  id: string;
  book_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  replies?: Comment[];
}

export interface Favorite {
  id: string;
  user_id: string;
  book_id: string;
  created_at: string;
  book?: Book;
}

export interface ReadingList {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  created_at: string;
  items?: ReadingListItem[];
}

export interface ReadingListItem {
  id: string;
  list_id: string;
  book_id: string;
  added_at: string;
  book?: Book;
}

export interface ReadingProgress {
  id: string;
  user_id: string;
  book_id: string;
  current_page: number;
  total_pages: number;
  progress_percent: number;
  reading_time_seconds: number;
  last_read_at: string;
  book?: Book;
}

export interface PageBookmark {
  id: string;
  user_id: string;
  book_id: string;
  page_number: number;
  note: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface SystemLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  profile?: Profile;
}

export interface Report {
  id: string;
  comment_id: string | null;
  reported_by: string;
  reason: string;
  status: ReportStatus;
  reviewed_by: string | null;
  created_at: string;
}

export type BookSortOption =
  | "title_asc"
  | "title_desc"
  | "author_asc"
  | "newest"
  | "popular"
  | "rating";

export interface BookFilters {
  search?: string;
  author?: string;
  category?: string;
  tag?: string;
  featured?: boolean;
  sort?: BookSortOption;
}

export interface DashboardStats {
  totalUsers: number;
  totalBooks: number;
  totalDownloads: number;
  newUsersToday: number;
  topBooks: { title: string; read_count: number }[];
  downloadsByDay: { date: string; count: number }[];
}
