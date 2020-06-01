import { AdminRegion } from './adminRegion';

export interface CountryData {
    id: string;
    iso2code: string;
    name: string;
    capitalCity: string;
    longitude: string;
    latitude: string;
    region: AdminRegion;
    adminregion: AdminRegion;
    incomeLevel: AdminRegion;
    lendingType: AdminRegion;
}
