export type RentalUnitStatus =
  | 'available'
  | 'reserved'
  | 'rented'
  | 'cleaning'
  | 'maintenance'
  | 'damaged'
  | 'lost'
  | 'retired';

export interface RentalUnit {
  id: string;
  productId: string;
  unitCode: string;
  displayName: string;
  status: RentalUnitStatus;
  conditionNote: string | null;
  isActive: boolean;
}
