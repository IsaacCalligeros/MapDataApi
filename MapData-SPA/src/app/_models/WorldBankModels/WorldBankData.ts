import { AgricultureCountry } from './AgricultureCountry';

export interface WorldBankData {

        indicator: AgricultureCountry;
        country: AgricultureCountry;
        countryiso3code: string;
        date: number;
        value: number;
        unit: string;
        obsStatus: string;
        decimal: number;
}
