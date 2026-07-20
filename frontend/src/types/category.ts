export interface Category {
  id: string;
  slug: string;
  name: string;
  type: 'flower' | 'gift' | 'greeting_board';
  isActive: boolean;
}
