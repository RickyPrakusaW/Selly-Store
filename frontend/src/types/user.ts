export type UserRole = 'customer' | 'owner' | 'finance' | 'staff_verification';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
}
