export interface Publication {
    id?: string;
    userId: string;
    userName: string;
    title: string;
    description: string;
    price: number;
    location: string;
    estacionamiento: string;
    capacity: number;
    images: string[];
    createdAt: Date;
    availability: boolean;
}
