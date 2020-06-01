import { Component, OnInit, Input } from '@angular/core';
import { CountryData } from 'src/app/_models/WorldBankModels/countryData';

@Component({
  selector: 'app-country-data-card',
  templateUrl: './country-data-card.component.html',
  styleUrls: ['./country-data-card.component.css']
})
export class CountryDataCardComponent implements OnInit {
  @Input() countryData: CountryData;

  constructor() { }
 
  ngOnInit() {
  }

}
