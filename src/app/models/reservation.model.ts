export interface Reservation {
    id?: string;
    publicationId: string;
    userId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    createdAt: Date;
  }
  