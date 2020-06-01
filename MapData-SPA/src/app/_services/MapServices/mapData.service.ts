import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { CountryData } from 'src/app/_models/WorldBankModels/countryData';
import { WorldBankData } from 'src/app/_models/WorldBankModels/WorldBankData';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MapDataService {
  baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }


getCountryData(countryCode): Observable<CountryData> {
  return this.http.get<CountryData>(this.baseUrl + 'map/GetWorldBank/' + countryCode);
}

GetCountryAgriculturalLandArea(countryCode, indicator): Observable<WorldBankData> {
  return this.http.get<WorldBankData>(this.baseUrl + 'map/GetCountryAgricultural/' + countryCode + '/' + indicator);
}

}


