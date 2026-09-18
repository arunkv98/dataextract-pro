export interface BP {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  count: number;
  status: 'active' | 'pending' | 'inactive';
  features: string[];
  buttonText: string;
}
