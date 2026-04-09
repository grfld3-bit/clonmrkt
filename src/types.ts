export interface Gift {
  id?: string;
  name: string;
  number?: string;
  price: number;
  imageUrl: string;
  marketplaceUrl: string;
  category?: string;
  createdAt?: any;
  createdBy: string;
}

export type Tab = 'Market' | 'Orders' | 'Play Hub' | 'Giveaways' | 'Storage';
export type Category = 'Gifts' | 'Stickers' | 'Stars & Prem' | 'Collections';
