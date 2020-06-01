import { Component, Output, Input, OnInit, NgZone, Renderer2, ViewChild, ElementRef, ɵConsole } from '@angular/core';

import 'ol/ol.css';
import OLMap from 'ol/Map';
import View from 'ol/View';
import GeoJSON from 'ol/format/GeoJSON';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import TileWMS from 'ol/source/TileWMS';

import Overlay from 'ol/Overlay';
import { createEmpty, extend } from 'ol/extent.js';
import { toStringHDMS } from 'ol/coordinate.js';
import { toLonLat } from 'ol/proj';
import { MapDataService } from '../_services/MapServices/mapData.service';
import { CountryData } from '../_models/WorldBankModels/countryData';
import { BehaviorSubject } from 'rxjs';
import { WorldBankData } from '../_models/WorldBankModels/WorldBankData';
import { Chart } from 'chart.js';
import { IndicatorKeyValue } from '../_models/WorldBankModels/IndicatorKeyValue';
import { HeaderType } from '../_models/WorldBankModels/HeaderType';
import { transformExtent } from 'ol/proj';
import { BoundElementProperty } from '@angular/compiler';
import { defaults } from 'ol/control';

@Component({
  selector: 'app-WorldBankData',
  templateUrl: './WorldBankData.component.html',
  styleUrls: ['./WorldBankData.component.css']
})

export class WorldBankDataComponent implements OnInit {
  countryData: CountryData;
  WorldBankDataSet: WorldBankData[][] = [];
  IndicatorKVP: Map<string, IndicatorKeyValue> = new Map<string, IndicatorKeyValue>();
  IndicatorArr: IndicatorKeyValue[] = [];

  CurrentOptions: string;
  CurrentCategory: string;
  headers: string[] = [];
  HeaderTypes: HeaderType[] = [];

  ChartArray: Chart[] = [];
  CanvasLength: number[] = new Array(3);
  chart;
  map;
  raster;
  geoMap;
  hoverStyle;
  fillStyle;
  vector;
  countryDataArray: CountryData[] = [];
  selected = [];
  C02DataAll = [];


  constructor(
    public mapService: MapDataService,
    private el: ElementRef,
    private renderer: Renderer2
  ) { }

  ngOnInit() {
    this.GenerateKeyValuePairIndicators();
    this.initilizeMap();
  }

  HeaderClick(header)
  {
    this.CurrentCategory = header;
    var indicatorsDom = document.getElementById('typeObj');
    var t = document.getElementById('Header_' + header);
    t.append(indicatorsDom);
  }

  TypeClick(item)
  {
    var elem = document.getElementById('selector_' + item.type);
    if(elem.classList.contains('d-none'))
    {
      var t = document.getElementById('selector_' + item.type).classList.remove('d-none');
    }
    else{
      var t = document.getElementById('selector_' + item.type).classList.add('d-none');
    }
  }

  SelectedChartIndicator(recipient) {
    this.CanvasLength.length = this.CanvasLength.length + 1;

    recipient.value.value = !recipient.value.value;
    if(recipient.value.value){
      if (this.selected.length !== 0) {
        this.runIndicatorQueries(recipient.value.value, recipient.key);
      }
    }
    else{
      var chartName = recipient.value.indicator;
      var chartId = 'chartJs_' + chartName.replace(/\s/g, '');
      var chartToRemove = document.getElementById(chartId);
      chartToRemove.remove();
      var index = this.ChartArray.map(d => d.options.title.text).indexOf(chartName);
      this.ChartArray.splice(index, 1);
    }
  }

  UpdateChartData(this_, data, id, isSelection) {
    var ChartName = data[1].purpleAgriculturalLandArray[0].indicator.value;
    var chartIndex = this.ChartArray.map(d => d.options.title.text).indexOf(ChartName);
    //var chartYears = this.ChartArray.map(d => d.values.years);
    //console.dir(chartYears);
    if (chartIndex === -1) {
      this_.PlotChart(ChartName);
    }
    else {
      this_.chart = this.ChartArray[chartIndex];
    }

    var name = data[1].purpleAgriculturalLandArray[0].country.value;
    if (isSelection === false) {
      this_.removeData(this_.chart, name);
    } else {
      const values = data[1].purpleAgriculturalLandArray;
      const hashName = this_.hashCode(name);
      const colourCode = this_.intToRGB(hashName).toString();
      this_.addData(this_.chart, name, colourCode, values);
    }
  }

  addData(chart, label, color, data) {
    var storage = [];
      data.forEach(element => {
        var x = element.date;
        var y = element.value;
        var json = {x: x, y: y};
       storage.push(json); 

      });
      chart.data.datasets.push({
      label: label,
      backgroundColor: color,
      data: storage,
    });
    chart.update();
  }

  removeData(chart, name) {
    let removalIndex = chart.data.datasets.map(d => d.label).indexOf(name);
    if (removalIndex >= 0) {
      chart.data.datasets.splice(removalIndex, 1);
    }
    chart.update();
  }

  hashCode(str) {
    let hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  }

  intToRGB(i) {
    var c = (i & 0x00FFFFFF)
      .toString(16)
      .toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  }

  PlotChart(chartName) {
    var this_ = this;

    var chartId = 'chartJs_' + chartName.replace(/\s/g, '');
    var emptyChart = document.querySelectorAll('*[id^="prePopchartJs_"]');
    var elem = emptyChart[emptyChart.length - 1];
    elem.id = chartId;
    (elem as HTMLElement).style.display = '';

    console.dir(window.innerWidth);
    console.dir(window.innerHeight);
    var ar = 2;
    if (window.innerWidth < 500)
    {
      ar = 1;
    }

    this.chart = new Chart(chartId, {
      type: 'scatter',

      options: {
        responsive: true,
        aspectRatio: ar,
        responsiveAnimationDuration: 500,
        
        title: {
          fontSize: 16,
          display: true,
          text: chartName
        },
        legend: {
          display: true
        },
        
        scales: {
          yAxes: [{
            display: true
          }],
        }
      }
    });
    this_.ChartArray.push(this.chart);
  }

  initilizeMap() {
    this.raster = new TileLayer({
      source: new OSM(),
      wrapX: false,
      noWrap: true
    });
    var maxExtent = transformExtent([-122.445717, 47.576989, -122.218094, 47.71623], 'EPSG:4326', 'EPSG:3857');

    this.geoMap = new TileLayer({
      source: new TileWMS({
        url: 'https://ahocevar.com/geoserver/wms',
        params: {
          'LAYERS': 'ne:NE1_HR_LC_SR_W_DR',
          'TILED': true
        }
      })
    });

    this.hoverStyle = new Style({
      stroke: new Stroke({
        color: '#3399CC',
        width: 3
      })
    });

    this.fillStyle = new Style({
      fill: new Fill({
        color: 'rgba(156,214,171,0.5)'
      }),
      stroke: new Stroke({
        color: '#3333CC',
        width: 3
      })
    });

    this.vector = new VectorLayer({
      source: new VectorSource({
        url: 'https://openlayers.org/en/v5.1.3/examples/data/geojson/countries.geojson',
        format: new GeoJSON()
      })
    });


    this.map = new OLMap({
      controls : defaults({
        zoom : false,
        rotate : false,
    }),
      layers: [this.geoMap, this.vector],
      target: 'map',
      view: new View({
        center: [0, 0],
        zoom: 1,
        minZoom: 1
      })
    });
    var mapService = this.mapService;
    var hoverElement = document.getElementById('hoverElement');
    var selectedNames = document.getElementById('selectedNames');
    var hover = null;

    this.map.on('pointermove', function (this, e) {
      if (hover !== null) {
        hover = null;
      }
      this.forEachFeatureAtPixel(e.pixel, function (f) {
        hover = f;
      });
      if (hover) {
        hoverElement.innerHTML = hover.get('name');
      } else {
        hoverElement.innerHTML = '&nbsp;';
      }
    });

    var this_ = this;
    this_.map.on('singleclick', async function (e) {
      await this.forEachFeatureAtPixel(e.pixel, function (f) {
        var isSelection = true;
        var selIndex = this_.selected.indexOf(f);
        if (selIndex < 0) {
          this_.selected.push(f);
          f.setStyle(this_.fillStyle);
        } else {
          isSelection = false;
          this_.selected.splice(selIndex, 1);
          f.setStyle(undefined);
        }
        this_.runQueries(f.id_, isSelection);
        mapService.getCountryData(f.id_).subscribe((data) => {
          if (selIndex < 0) {
            this_.countryDataArray.push(data[1].purpleCountryDataDtoArray[0]);
          } else {
            this_.countryDataArray.splice(selIndex, 1);
          }
        });
        // selectedNames.innerHTML = '&nbsp;Selected Countries:&nbsp;';
      });
      // if(this_.selected.length === 0)
      // {
      //   var charts = document.querySelectorAll('*[id^="chartJs_"]');
      //   charts.forEach(element => {
      //     element.parentElement.remove();
      //   });
      // }
      // this_.selected.forEach(function (f) {
      //   selectedNames.innerHTML += f.values_.name + ', ';
      // });

      const coordinate = e.coordinate;
      const hdms = toStringHDMS(toLonLat(coordinate));
    });
  }

  runQueries(this, id, isSelection) {
    var this_ = this;
    var id_ = id;
    var mapService = this_.mapService;
    this.IndicatorKVP.forEach((value: IndicatorKeyValue, key: string) => {
      if (value.value) {
        mapService.GetCountryAgriculturalLandArea(id_, key).subscribe((data) => {
          this_.UpdateChartData(this_, data, id_, isSelection);
        });
      }
    });
  }
  runIndicatorQueries(this, isSelection, key) {
    var this_ = this;
    var mapService = this_.mapService;
    this.selected.forEach(element => {
      mapService.GetCountryAgriculturalLandArea(element.id_, key).subscribe((data) => {
        this_.UpdateChartData(this_, data, element.id_, isSelection);
      });
    });
  }


  GenerateKeyValuePairIndicators() {
    //Auto generated these with a python script, should check if there's an easy way of going about this.
    //Possible project writing a simple english based regex web app?
    //Agriculture
    var bar: IndicatorKeyValue = { indicator: 'Agricultural land (% of land area)', header: 'Environment', value: false, type: 'Agriculture' };
    this.IndicatorKVP.set('AG.LND.AGRI.ZS', bar);

    bar = { indicator: 'Land under cereal production (hectares)', header: 'Environment', value: false, type: 'Agriculture' };
    this.IndicatorKVP.set('AG.LND.CREL.HA', bar);

    //Cereal yield (kg per hectare)
    bar = { indicator: 'Cereal yield (kg per hectare)', header: 'Environment', value: false, type: 'Agriculture' };
    this.IndicatorKVP.set('AG.YLD.CREL.KG', bar);

    //Agriculture, value added per worker (constant 2010 US$)
    bar = { indicator: 'Agriculture, value added per worker (constant 2010 US$)', header: 'Environment', value: false, type: 'Agriculture' };
    this.IndicatorKVP.set('NV.AGR.EMPL.KD', bar);

    //Climate
    //CO2 emissions (metric tons per capita)
    bar = { indicator: 'CO2 emissions (metric tons per capita)', header: 'Environment', value: false, type: 'Climate' };
    this.IndicatorKVP.set('EN.ATM.CO2E.PC', bar);
    bar = { indicator: 'PM2.5 air pollution, mean annual exposure (micrograms per cubic meter)', header: 'Environment', value: false, type: 'Climate' };
    this.IndicatorKVP.set('EN.ATM.PM25.MC.M3', bar);
    bar = { indicator: 'PM2.5 air pollution, population exposed to levels exceeding WHO guideline value (% of total)', header: 'Environment', value: false, type: 'Climate' };
    this.IndicatorKVP.set('EN.ATM.PM25.MC.ZS', bar);
    bar = { indicator: 'Average precipitation in depth (mm per year)', header: 'Environment', value: false, type: 'Climate' };
    this.IndicatorKVP.set('AG.LND.PRCP.MM', bar);


    //Energy & mining
    bar = { indicator: 'Energy intensity level of primary energy (MJ/$2011 PPP GDP)', header: 'Environment', value: false, type: 'Energy' };
    this.IndicatorKVP.set('EG.EGY.PRIM.PP.KD', bar);
    bar = { indicator: 'Renewable energy consumption (% of total final energy consumption)', header: 'Environment', value: false, type: 'Energy' };
    this.IndicatorKVP.set('EG.FEC.RNEW.ZS', bar);
    bar = { indicator: 'Renewable electricity output (% of total electricity output)', header: 'Environment', value: false, type: 'Energy' };
    this.IndicatorKVP.set('EG.ELC.RNEW.ZS	', bar);
    bar = { indicator: 'Access to electricity (% of population)', header: 'Environment', value: false, type: 'Energy' };
    this.IndicatorKVP.set('EG.ELC.ACCS.ZS', bar);
    bar = { indicator: 'Access to clean fuels and technologies for cooking (% of population)', header: 'Environment', value: false, type: 'Energy' };
    this.IndicatorKVP.set('EG.CFT.ACCS.ZS	', bar);

    //Environment
    //
    bar = { indicator: 'Forest area (% of land area)', header: 'Environment', value: false, type: 'Environment' };
    this.IndicatorKVP.set('AG.LND.FRST.ZS', bar);
    bar = { indicator: 'Total natural resources rents (% of GDP)', header: 'Environment', value: false, type: 'Environment' };
    this.IndicatorKVP.set('NY.GDP.TOTL.RT.ZS', bar);
    bar = { indicator: 'Terrestrial protected areas (% of total land area)', header: 'Environment', value: false, type: 'Environment' };
    this.IndicatorKVP.set('ER.LND.PTLD.ZS	', bar);
    bar = { indicator: 'Terrestrial and marine protected areas (% of total territorial area)', header: 'Environment', value: false, type: 'Environment' };
    this.IndicatorKVP.set('ER.PTD.TOTL.ZS', bar);
    bar = { indicator: 'Marine protected areas (% of territorial waters)', header: 'Environment', value: false, type: 'Environment' };
    this.IndicatorKVP.set('ER.MRN.PTMR.ZS', bar);

    //Urban and rural development
    bar = { indicator: 'Access to electricity, urban (% of urban population)', header: 'Environment', value: false, type: 'development' };
    this.IndicatorKVP.set('EG.ELC.ACCS.UR.ZS', bar);
    bar = { indicator: 'People using at least basic drinking water services, urban (% of urban population)', header: 'Environment', value: false, type: 'development' };
    this.IndicatorKVP.set('SH.H2O.BASW.UR.ZS', bar);
    bar = { indicator: 'People using at least basic sanitation services, urban (% of urban population)', header: 'Environment', value: false, type: 'development' };
    this.IndicatorKVP.set('SH.STA.BASS.UR.ZS', bar);
    bar = { indicator: 'Access to electricity, rural (% of rural population)', header: 'Environment', value: false, type: 'development' };
    this.IndicatorKVP.set('EG.ELC.ACCS.RU.ZS', bar);
    bar = { indicator: 'People using at least basic sanitation services, rural (% of rural population)', header: 'Environment', value: false, type: 'development' };
    this.IndicatorKVP.set('SH.STA.BASS.RU.ZS', bar);
    bar = { indicator: 'People using at least basic drinking water services, rural (% of rural population)', header: 'Environment', value: false, type: 'development' };
    this.IndicatorKVP.set('SH.H2O.BASW.RU.ZS', bar);

    //Water and sanitation
    bar = { indicator: 'Renewable internal freshwater resources per capita (cubic meters)', header: 'Environment', value: false, type: 'Water and sanitation' };
    this.IndicatorKVP.set('ER.H2O.INTR.PC', bar);
    bar = { indicator: 'Annual freshwater withdrawals, total (% of internal resources)', header: 'Global Links', value: false, type: 'Water and sanitation' };
    this.IndicatorKVP.set('ER.H2O.FWTL.ZS', bar);
    bar = { indicator: 'Water productivity, total(constant 2010 US$ GDP per cubic meter of total freshwater withdrawal)', header: 'Global Links', value: false, type: 'Water and sanitation' };
    this.IndicatorKVP.set('ER.GDP.FWTL.M3.KD', bar);
    bar = { indicator: 'People using safely managed drinking water services (% of population)', header: 'Global Links', value: false, type: 'Water and sanitation' };
    this.IndicatorKVP.set('SH.H2O.SMDW.ZS', bar);
    bar = { indicator: 'People using safely managed sanitation services (% of population)', header: 'Global Links', value: false, type: 'Water and sanitation' };
    this.IndicatorKVP.set('SH.STA.SMSS.ZS', bar);

    //Region Global Links
    //External debt
    bar = { indicator: 'External debt stocks, total (DOD, current US$)', header: 'Global Links', value: false, type: 'External debt' };
    this.IndicatorKVP.set('DT.DOD.DECT.CD', bar);
    bar = { indicator: 'External debt stocks, short-term (DOD, current US$)', header: 'Global Links', value: false, type: 'External debt' };
    this.IndicatorKVP.set('DT.DOD.DSTC.CD', bar);
    bar = { indicator: 'External debt stocks, long-term (DOD, current US$)', header: 'Global Links', value: false, type: 'External debt' };
    this.IndicatorKVP.set('DT.DOD.DLXF.CD', bar);
    bar = { indicator: 'External debt stocks, public and publicly guaranteed (PPG) (DOD, current US$)', header: 'Global Links', value: false, type: 'External debt' };
    this.IndicatorKVP.set('DT.DOD.DPPG.CD', bar);
    bar = { indicator: 'External debt stocks, private nonguaranteed (PNG) (DOD, current US$)', header: 'Global Links', value: false, type: 'External debt' };
    this.IndicatorKVP.set('DT.DOD.DPNG.CD', bar);
    bar = { indicator: 'Total debt service (% of exports of goods, services and primary income)', header: 'Global Links', value: false, type: 'External debt' };
    this.IndicatorKVP.set('DT.TDS.DECT.EX.ZS', bar);
    //Trade
    bar = { indicator: 'Merchandise trade (% of GDP)', header: 'Global Links', value: false, type: 'Trade' };
    this.IndicatorKVP.set('TG.VAL.TOTL.GD.ZS', bar);
    bar = { indicator: 'Net barter terms of trade index (2000 = 100)', header: 'Global Links', value: false, type: 'Trade' };
    this.IndicatorKVP.set('TT.PRI.MRCH.XD.WD', bar);
    //Financial flows
    bar = { indicator: 'Foreign direct investment, net inflows (BoP, current US$)', header: 'Global Links', value: false, type: 'Financial flows' };
    this.IndicatorKVP.set('BX.KLT.DINV.CD.WD', bar);
    bar = { indicator: 'Personal remittances, received (current US$)', header: 'Global Links', value: false, type: 'Financial flows' };
    this.IndicatorKVP.set('BX.TRF.PWKR.CD.DT', bar);
    bar = { indicator: 'Portfolio equity, net inflows (BoP, current US$)', header: 'Global Links', value: false, type: 'Financial flows' };
    this.IndicatorKVP.set('BX.PEF.TOTL.CD.WD', bar);
    //Aid dependency
    bar = { indicator: 'Net official development assistance and official aid received (current US$)', header: 'Global Links', value: false, type: 'Aid dependency' };
    this.IndicatorKVP.set('DT.ODA.ALLD.CD', bar);
    bar = { indicator: 'Net official development assistance received (current US$)', header: 'Global Links', value: false, type: 'Aid dependency' };
    this.IndicatorKVP.set('DT.ODA.ODAT.CD', bar);
    bar = { indicator: 'Net ODA received (% of GNI)', header: 'Global Links', value: false, type: 'Aid dependency' };
    this.IndicatorKVP.set('DT.ODA.ODAT.GN.ZS', bar);
    //Refugees
    bar = { indicator: 'Refugee population by country or territory of asylum', header: 'Global Links', value: false, type: 'Refugees' };
    this.IndicatorKVP.set('SM.POP.REFG', bar);
    bar = { indicator: 'Refugee population by country or territory of origin', header: 'Global Links', value: false, type: 'Refugees' };
    this.IndicatorKVP.set('SM.POP.REFG.OR', bar);
    //Tourism
    bar = { indicator: 'International tourism, receipts (% of total exports)', header: 'Global Links', value: false, type: 'Tourism' };
    this.IndicatorKVP.set('ST.INT.RCPT.XP.ZS', bar);
    bar = { indicator: 'International tourism, expenditures (% of total imports)', header: 'Global Links', value: false, type: 'Tourism' };
    this.IndicatorKVP.set('ST.INT.XPND.MP.ZS', bar);
    //Migration
    bar = { indicator: 'Net migration', header: 'Global Links', value: false, type: 'Migration' };
    this.IndicatorKVP.set('SM.POP.NETM', bar);

    //States and Markets
    //Business environment
    bar = { indicator: 'Time required to start a business (days)', header: 'States and Markets', value: false, type: 'Business environment' };
    this.IndicatorKVP.set('IC.REG.DURS', bar);
    bar = { indicator: 'Time required to get electricity (days)', header: 'States and Markets', value: false, type: 'Business environment' };
    this.IndicatorKVP.set('IC.ELC.TIME', bar);
    bar = { indicator: 'Firms expected to give gifts in meetings with tax officials (% of firms)', header: 'States and Markets', value: false, type: 'Business environment' };
    this.IndicatorKVP.set('IC.TAX.GIFT.ZS', bar);
    bar = { indicator: 'Firms with female top manager (% of firms)', header: 'States and Markets', value: false, type: 'Business environment' };
    this.IndicatorKVP.set('IC.FRM.FEMM.ZS', bar);
    //Financial access and stability
    bar = { indicator: 'Depositors with commercial banks (per 1,000 adults)', header: 'States and Markets', value: false, type: 'Financial access and stability' };
    this.IndicatorKVP.set('FB.CBK.DPTR.P3', bar);
    bar = { indicator: 'Borrowers from commercial banks (per 1,000 adults)', header: 'States and Markets', value: false, type: 'Financial access and stability' };
    this.IndicatorKVP.set('FB.CBK.BRWR.P3', bar);
    bar = { indicator: 'Commercial bank branches (per 100,000 adults)', header: 'States and Markets', value: false, type: 'Financial access and stability' };
    this.IndicatorKVP.set('FB.CBK.BRCH.P5', bar);
    bar = { indicator: 'Bank nonperforming loans to total gross loans (%)', header: 'States and Markets', value: false, type: 'Financial access and stability' };
    this.IndicatorKVP.set('FB.AST.NPER.ZS', bar);
    //Stock markets
    bar = { indicator: 'Market capitalization of listed domestic companies (% of GDP)', header: 'States and Markets', value: false, type: 'Stock markets' };
    this.IndicatorKVP.set('CM.MKT.LCAP.GD.ZS', bar);
    bar = { indicator: 'Stocks traded, turnover ratio of domestic shares (%)', header: 'States and Markets', value: false, type: 'Stock markets' };
    this.IndicatorKVP.set('CM.MKT.TRNR   ', bar);
    //Government finance and taxes
    bar = { indicator: 'Revenue, excluding grants (current LCU)', header: 'States and Markets', value: false, type: 'Government finance and taxes' };
    this.IndicatorKVP.set('GC.REV.XGRT.CN', bar);
    bar = { indicator: 'Expense (current LCU)', header: 'States and Markets', value: false, type: 'Government finance and taxes' };
    this.IndicatorKVP.set('GC.XPN.TOTL.CN', bar);
    bar = { indicator: 'Net lending (+) / net borrowing (-) (current LCU)', header: 'States and Markets', value: false, type: 'Government finance and taxes' };
    this.IndicatorKVP.set('GC.NLD.TOTL.CN', bar);
    bar = { indicator: 'Compensation of employees (current LCU)', header: 'States and Markets', value: false, type: 'Government finance and taxes' };
    this.IndicatorKVP.set('GC.XPN.COMP.CN', bar);
    bar = { indicator: 'Taxes on goods and services (current LCU)', header: 'States and Markets', value: false, type: 'Government finance and taxes' };
    this.IndicatorKVP.set('GC.TAX.GSRV.CN', bar);
    bar = { indicator: 'Profit tax (% of commercial profits)', header: 'States and Markets', value: false, type: 'Government finance and taxes' };
    this.IndicatorKVP.set('IC.TAX.PRFT.CP.ZS', bar);
    bar = { indicator: 'Total tax rate (% of commercial profits)', header: 'States and Markets', value: false, type: 'Government finance and taxes' };
    this.IndicatorKVP.set('IC.TAX.TOTL.CP.ZS', bar);
    //Military and fragile situations
    bar = { indicator: 'Military expenditure (% of GDP)', header: 'States and Markets', value: false, type: 'Military and fragile situations' };
    this.IndicatorKVP.set('MS.MIL.XPND.GD.ZS', bar);
    bar = { indicator: 'Armed forces personnel, total', header: 'States and Markets', value: false, type: 'Military and fragile situations' };
    this.IndicatorKVP.set('MS.MIL.TOTL.P1', bar);
    bar = { indicator: 'Battle-related deaths (number of people)', header: 'States and Markets', value: false, type: 'Military and fragile situations' };
    this.IndicatorKVP.set('VC.BTL.DETH', bar);
    bar = { indicator: 'Intentional homicides (per 100,000 people)', header: 'States and Markets', value: false, type: 'Military and fragile situations' };
    this.IndicatorKVP.set('VC.IHR.PSRC.P5', bar);
    //Infrastructure and communications
    bar = { indicator: 'Air transport, passengers carried', header: 'States and Markets', value: false, type: 'Infrastructure and communications' };
    this.IndicatorKVP.set('IS.AIR.PSGR', bar);
    bar = { indicator: 'Air transport, freight (million ton-km)', header: 'States and Markets', value: false, type: 'Infrastructure and communications' };
    this.IndicatorKVP.set('IS.AIR.GOOD.MT.K1', bar);
    bar = { indicator: 'Container port traffic (TEU: 20 foot equivalent units)', header: 'States and Markets', value: false, type: 'Infrastructure and communications' };
    this.IndicatorKVP.set('IS.SHP.GOOD.TU', bar);
    bar = { indicator: 'Individuals using the Internet (% of population)', header: 'States and Markets', value: false, type: 'Infrastructure and communications' };
    this.IndicatorKVP.set('IT.NET.USER.ZS', bar);
    bar = { indicator: 'Mobile cellular subscriptions (per 100 people)', header: 'States and Markets', value: false, type: 'Infrastructure and communications' };
    this.IndicatorKVP.set('IT.CEL.SETS.P2', bar);
    bar = { indicator: 'Investment in transport with private participation (current US$)', header: 'States and Markets', value: false, type: 'Infrastructure and communications' };
    this.IndicatorKVP.set('IE.PPI.TRAN.CD', bar);
    bar = { indicator: 'Investment in energy with private participation (current US$)', header: 'States and Markets', value: false, type: 'Infrastructure and communications' };
    this.IndicatorKVP.set('IE.PPI.ENGY.CD', bar);
    //Science and innovation
    bar = { indicator: 'Research and development expenditure (% of GDP)', header: 'States and Markets', value: false, type: 'Science and innovation' };
    this.IndicatorKVP.set('GB.XPD.RSDV.GD.ZS', bar);
    bar = { indicator: 'Patent applications, residents', header: 'States and Markets', value: false, type: 'Science and innovation' };
    this.IndicatorKVP.set('IP.PAT.RESD', bar);
    bar = { indicator: 'Industrial design applications, resident, by count', header: 'States and Markets', value: false, type: 'Science and innovation' };
    this.IndicatorKVP.set('IP.IDS.RSCT', bar);
    bar = { indicator: 'Scientific and technical journal articles', header: 'States and Markets', value: false, type: 'Science and innovation' };
    this.IndicatorKVP.set('IP.JRN.ARTC.SC', bar);
    bar = { indicator: 'ICT goods exports (% of total goods exports)', header: 'States and Markets', value: false, type: 'Science and innovation' };
    this.IndicatorKVP.set('TX.VAL.ICTG.ZS.UN', bar);

    //region Economy 
    //Business environment
    bar = { indicator: 'Time required to start a business (days)', header: 'Economy', value: false, type: 'Business environment' };
    this.IndicatorKVP.set('IC.REG.DURS', bar);
    bar = { indicator: 'Time required to get electricity (days)', header: 'Economy', value: false, type: 'Business environment' };
    this.IndicatorKVP.set('IC.ELC.TIME', bar);
    bar = { indicator: 'Firms expected to give gifts in meetings with tax officials (% of firms)', header: 'Economy', value: false, type: 'Business environment' };
    this.IndicatorKVP.set('IC.TAX.GIFT.ZS', bar);
    bar = { indicator: 'Firms with female top manager (% of firms)', header: 'Economy', value: false, type: 'Business environment' };
    this.IndicatorKVP.set('IC.FRM.FEMM.ZS', bar);
    //Financial access and stability
    bar = { indicator: 'Depositors with commercial banks (per 1,000 adults)', header: 'Economy', value: false, type: 'Financial access and stability' };
    this.IndicatorKVP.set('FB.CBK.DPTR.P3', bar);
    bar = { indicator: 'Borrowers from commercial banks (per 1,000 adults)', header: 'Economy', value: false, type: 'Financial access and stability' };
    this.IndicatorKVP.set('FB.CBK.BRWR.P3', bar);
    bar = { indicator: 'Commercial bank branches (per 100,000 adults)', header: 'Economy', value: false, type: 'Financial access and stability' };
    this.IndicatorKVP.set('FB.CBK.BRCH.P5', bar);
    bar = { indicator: 'Bank nonperforming loans to total gross loans (%)', header: 'Economy', value: false, type: 'Financial access and stability' };
    this.IndicatorKVP.set('FB.AST.NPER.ZS', bar);
    //Stock markets
    bar = { indicator: 'Market capitalization of listed domestic companies (% of GDP)', header: 'Economy', value: false, type: 'Stock markets' };
    this.IndicatorKVP.set('CM.MKT.LCAP.GD.ZS', bar);
    bar = { indicator: 'Stocks traded, turnover ratio of domestic shares (%)', header: 'Economy', value: false, type: 'Stock markets' };
    //Growth and economic structure
    bar = { indicator: 'GDP (current US$)', header: 'Economy', value: false, type: 'Growth and economic structure' };
    this.IndicatorKVP.set('NY.GDP.MKTP.CD', bar);
    bar = { indicator: 'GDP growth (annual %)', header: 'Economy', value: false, type: 'Growth and economic structure' };
    this.IndicatorKVP.set('NY.GDP.MKTP.KD.ZG', bar);
    bar = { indicator: 'Agriculture, value added (annual % growth)', header: 'Economy', value: false, type: 'Growth and economic structure' };
    this.IndicatorKVP.set('NV.AGR.TOTL.KD.ZG', bar);
    bar = { indicator: 'Industry, value added (annual % growth)', header: 'Economy', value: false, type: 'Growth and economic structure' };
    this.IndicatorKVP.set('NV.IND.TOTL.KD.ZG', bar);
    bar = { indicator: 'Manufacturing, value added (annual % growth)', header: 'Economy', value: false, type: 'Growth and economic structure' };
    this.IndicatorKVP.set('NV.IND.MANF.KD.ZG', bar);
    bar = { indicator: 'Services, value added (annual % growth)', header: 'Economy', value: false, type: 'Growth and economic structure' };
    this.IndicatorKVP.set('NV.SRV.TOTL.KD.ZG', bar);
    bar = { indicator: 'Final consumption expenditure (annual % growth)', header: 'Economy', value: false, type: 'Growth and economic structure' };
    this.IndicatorKVP.set('NE.CON.TOTL.KD.ZG', bar);
    bar = { indicator: 'Gross capital formation (annual % growth)', header: 'Economy', value: false, type: 'Growth and economic structure' };
    this.IndicatorKVP.set('NE.GDI.TOTL.KD.ZG', bar);
    bar = { indicator: 'Exports of goods and services (annual % growth)', header: 'Economy', value: false, type: 'Growth and economic structure' };
    this.IndicatorKVP.set('NE.EXP.GNFS.KD.ZG', bar);
    bar = { indicator: 'Imports of goods and services (annual % growth)', header: 'Economy', value: false, type: 'Growth and economic structure' };
    this.IndicatorKVP.set('NE.IMP.GNFS.KD.ZG', bar);
    bar = { indicator: 'Agriculture, value added (% of GDP)', header: 'Economy', value: false, type: 'Growth and economic structure' };
    this.IndicatorKVP.set('NV.AGR.TOTL.ZS', bar);
    bar = { indicator: 'Industry, value added (% of GDP)', header: 'Economy', value: false, type: 'Growth and economic structure' };
    this.IndicatorKVP.set('NV.IND.TOTL.ZS', bar);
    bar = { indicator: 'Services, value added (% of GDP)', header: 'Economy', value: false, type: 'Growth and economic structure' };
    this.IndicatorKVP.set('NV.SRV.TOTL.ZS', bar);
    bar = { indicator: 'Final consumption expenditure (% of GDP)', header: 'Economy', value: false, type: 'Growth and economic structure' };
    this.IndicatorKVP.set('NE.CON.TOTL.ZS', bar);
    bar = { indicator: 'Gross capital formation (% of GDP)', header: 'Economy', value: false, type: 'Growth and economic structure' };
    this.IndicatorKVP.set('NE.GDI.TOTL.ZS', bar);
    bar = { indicator: 'Exports of goods and services (% of GDP)', header: 'Economy', value: false, type: 'Growth and economic structure' };
    this.IndicatorKVP.set('NE.EXP.GNFS.ZS', bar);
    bar = { indicator: 'Imports of goods and services (% of GDP)', header: 'Economy', value: false, type: 'Growth and economic structure' };
    this.IndicatorKVP.set('NE.IMP.GNFS.ZS', bar);
    //Income and savings
    bar = { indicator: 'GNI per capita, Atlas method (current US$)', header: 'Economy', value: false, type: 'Income and savings' };
    this.IndicatorKVP.set('NY.GNP.PCAP.CD', bar);
    bar = { indicator: 'GNI per capita, PPP (current international $)', header: 'Economy', value: false, type: 'Income and savings' };
    this.IndicatorKVP.set('NY.GNP.PCAP.PP.CD', bar);
    // bar = { indicator: 'Population, total', header: 'Economy', value: false, type: 'Income and savings' };
    // this.IndicatorKVP.set('SP.POP.TOTL', bar);
    bar = { indicator: 'Gross savings (% of GDP)', header: 'Economy', value: false, type: 'Income and savings' };
    this.IndicatorKVP.set('NY.GNS.ICTR.ZS', bar);
    bar = { indicator: 'Adjusted net savings, including particulate emission damage (% of GNI)', header: 'Economy', value: false, type: 'Income and savings' };
    this.IndicatorKVP.set('NY.ADJ.SVNG.GN.ZS', bar);
    //Balance of payments
    bar = { indicator: 'Export value index (2000 = 100)', header: 'Economy', value: false, type: 'Balance of payments' };
    this.IndicatorKVP.set('TX.VAL.MRCH.XD.WD', bar);
    bar = { indicator: 'Import value index (2000 = 100)', header: 'Economy', value: false, type: 'Balance of payments' };
    this.IndicatorKVP.set('TM.VAL.MRCH.XD.WD', bar);
    bar = { indicator: 'Personal remittances, received (% of GDP)', header: 'Economy', value: false, type: 'Balance of payments' };
    this.IndicatorKVP.set('BX.TRF.PWKR.DT.GD.ZS', bar);
    bar = { indicator: 'Current account balance (% of GDP)', header: 'Economy', value: false, type: 'Balance of payments' };
    this.IndicatorKVP.set('BN.CAB.XOKA.GD.ZS', bar);
    bar = { indicator: 'Foreign direct investment, net inflows (% of GDP)', header: 'Economy', value: false, type: 'Balance of payments' };
    this.IndicatorKVP.set('BX.KLT.DINV.WD.GD.ZS', bar);
    //Prices and terms of trade
    bar = { indicator: 'Consumer price index (2010 = 100)', header: 'Economy', value: false, type: 'Prices and terms of trade' };
    this.IndicatorKVP.set('FP.CPI.TOTL', bar);
    bar = { indicator: 'Export unit value index (2000 = 100)', header: 'Economy', value: false, type: 'Prices and terms of trade' };
    this.IndicatorKVP.set('TX.UVI.MRCH.XD.WD', bar);
    bar = { indicator: 'Import unit value index (2000 = 100)', header: 'Economy', value: false, type: 'Prices and terms of trade' };
    this.IndicatorKVP.set('TM.UVI.MRCH.XD.WD', bar);
    bar = { indicator: 'Net barter terms of trade index (2000 = 100)', header: 'Economy', value: false, type: 'Prices and terms of trade' };
    this.IndicatorKVP.set('TT.PRI.MRCH.XD.WD', bar);
    //Labor and productivity
    bar = { indicator: 'GDP per person employed (constant 2011 PPP $)', header: 'Economy', value: false, type: 'Labor and productivity' };
    this.IndicatorKVP.set('SL.GDP.PCAP.EM.KD', bar);
    bar = { indicator: 'Unemployment, total (% of total labor force) (modeled ILO estimate)', header: 'Economy', value: false, type: 'Labor and productivity' };
    this.IndicatorKVP.set('SL.UEM.TOTL.ZS', bar);
    bar = { indicator: 'Agriculture, value added per worker (constant 2010 US$)', header: 'Economy', value: false, type: 'Labor and productivity' };
    this.IndicatorKVP.set('NV.AGR.EMPL.KD', bar);
    bar = { indicator: 'Industry, value added per worker (constant 2010 US$)', header: 'Economy', value: false, type: 'Labor and productivity' };
    this.IndicatorKVP.set('NV.IND.EMPL.KD', bar);
    bar = { indicator: 'Services, value added per worker (constant 2010 US$)', header: 'Economy', value: false, type: 'Labor and productivity' };
    this.IndicatorKVP.set('NV.SRV.EMPL.KD', bar);


    //People
    //Population dynamics
    bar = { indicator: 'Population, total', header: 'People', value: false, type: 'Population dynamics' };
    this.IndicatorKVP.set('SP.POP.TOTL', bar);
    bar = { indicator: 'Population growth (annual %)', header: 'People', value: false, type: 'Population dynamics' };
    this.IndicatorKVP.set('SP.POP.GROW', bar);
    bar = { indicator: 'Birth rate, crude (per 1,000 people)', header: 'People', value: false, type: 'Population dynamics' };
    this.IndicatorKVP.set('SP.DYN.CBRT.IN', bar);
    bar = { indicator: 'Death rate, crude (per 1,000 people)', header: 'People', value: false, type: 'Population dynamics' };
    this.IndicatorKVP.set('SP.DYN.CDRT.IN', bar);
    bar = { indicator: 'Fertility rate, total (births per woman)', header: 'People', value: false, type: 'Population dynamics' };
    this.IndicatorKVP.set('SP.DYN.TFRT.IN', bar);
    bar = { indicator: 'Life expectancy at birth, male (years)', header: 'People', value: false, type: 'Population dynamics' };
    this.IndicatorKVP.set('SP.DYN.LE00.MA.IN', bar);
    bar = { indicator: 'Life expectancy at birth, female (years)', header: 'People', value: false, type: 'Population dynamics' };
    this.IndicatorKVP.set('SP.DYN.LE00.FE.IN', bar);
    bar = { indicator: 'Age dependency ratio, young (% of working-age population)', header: 'People', value: false, type: 'Population dynamics' };
    this.IndicatorKVP.set('SP.POP.DPND.YG', bar);
    bar = { indicator: 'Age dependency ratio, old (% of working-age population)', header: 'People', value: false, type: 'Population dynamics' };
    this.IndicatorKVP.set('SP.POP.DPND.OL', bar);
    //Education
    bar = { indicator: 'Government expenditure on education, total (% of GDP)', header: 'People', value: false, type: 'Education' };
    this.IndicatorKVP.set('SE.XPD.TOTL.GD.ZS', bar);
    bar = { indicator: 'School enrollment, primary (% gross)', header: 'People', value: false, type: 'Education' };
    this.IndicatorKVP.set('SE.PRM.ENRR', bar);
    bar = { indicator: 'School enrollment, secondary (% gross)', header: 'People', value: false, type: 'Education' };
    this.IndicatorKVP.set('SE.SEC.ENRR', bar);
    bar = { indicator: 'School enrollment, tertiary (% gross)', header: 'People', value: false, type: 'Education' };
    this.IndicatorKVP.set('SE.TER.ENRR', bar);
    bar = { indicator: 'Progression to secondary school (%)', header: 'People', value: false, type: 'Education' };
    this.IndicatorKVP.set('SE.SEC.PROG.ZS', bar);
    bar = { indicator: 'Primary completion rate, total (% of relevant age group)', header: 'People', value: false, type: 'Education' };
    this.IndicatorKVP.set('SE.PRM.CMPT.ZS', bar);
    bar = { indicator: 'Literacy rate, youth total (% of people ages 15-24)', header: 'People', value: false, type: 'Education' };
    this.IndicatorKVP.set('SE.ADT.1524.LT.ZS', bar);
    //Labor
    bar = { indicator: 'Labor force participation rate, total (% of total population ages 15+) (modeled ILO estimate)', header: 'People', value: false, type: 'Labor' };
    this.IndicatorKVP.set('SL.TLF.CACT.ZS', bar);
    bar = { indicator: 'Employment in agriculture (% of total employment) (modeled ILO estimate)', header: 'People', value: false, type: 'Labor' };
    this.IndicatorKVP.set('SL.AGR.EMPL.ZS', bar);
    bar = { indicator: 'Employment in industry (% of total employment) (modeled ILO estimate)', header: 'People', value: false, type: 'Labor' };
    this.IndicatorKVP.set('SL.IND.EMPL.ZS', bar);
    bar = { indicator: 'Employment in services (% of total employment) (modeled ILO estimate)', header: 'People', value: false, type: 'Labor' };
    this.IndicatorKVP.set('SL.SRV.EMPL.ZS', bar);
    bar = { indicator: 'Employment to population ratio, 15+, total (%) (modeled ILO estimate)', header: 'People', value: false, type: 'Labor' };
    this.IndicatorKVP.set('SL.EMP.TOTL.SP.ZS', bar);
    bar = { indicator: 'Unemployment, total (% of total labor force) (modeled ILO estimate)', header: 'People', value: false, type: 'Labor' };
    this.IndicatorKVP.set('SL.UEM.TOTL.ZS', bar);
    bar = { indicator: 'Children in employment, total (% of children ages 7-14)', header: 'People', value: false, type: 'Labor' };
    this.IndicatorKVP.set('SL.TLF.0714.ZS', bar);
    //Health
    bar = { indicator: 'Prevalence of stunting, height for age (% of children under 5)', header: 'People', value: false, type: 'Health' };
    this.IndicatorKVP.set('SH.STA.STNT.ZS', bar);
    bar = { indicator: 'Maternal mortality ratio (modeled estimate, per 100,000 live births)', header: 'People', value: false, type: 'Health' };
    this.IndicatorKVP.set('SH.STA.MMRT', bar);
    bar = { indicator: 'Mortality rate, under-5 (per 1,000 live births)', header: 'People', value: false, type: 'Health' };
    this.IndicatorKVP.set('SH.DYN.MORT', bar);
    bar = { indicator: 'Incidence of HIV (% of uninfected population ages 15-49)', header: 'People', value: false, type: 'Health' };
    this.IndicatorKVP.set('SH.HIV.INCD.ZS', bar);
    bar = { indicator: 'Mortality from CVD, cancer, diabetes or CRD between exact ages 30 and 70 (%)', header: 'People', value: false, type: 'Health' };
    this.IndicatorKVP.set('SH.DYN.NCOM.ZS', bar);
    bar = { indicator: 'Mortality caused by road traffic injury (per 100,000 people)', header: 'People', value: false, type: 'Health' };
    this.IndicatorKVP.set('SH.STA.TRAF.P5', bar);
    bar = { indicator: 'Adolescent fertility rate (births per 1,000 women ages 15-19)', header: 'People', value: false, type: 'Health' };
    this.IndicatorKVP.set('SP.ADO.TFRT', bar);
    bar = { indicator: 'Proportion of population spending more than 10% of household consumption or income on out-of-pocket health care expenditure (%)', header: 'People', value: false, type: 'Health' };
    this.IndicatorKVP.set('SH.UHC.OOPC.10.ZS', bar);
    //Gender
    bar = { indicator: 'School enrollment, primary and secondary (gross), gender parity index (GPI)', header: 'People', value: false, type: 'Gender' };
    this.IndicatorKVP.set('SE.ENR.PRSC.FM.ZS', bar);
    bar = { indicator: 'Women who were first married by age 18 (% of women ages 20-24)', header: 'People', value: false, type: 'Gender' };
    this.IndicatorKVP.set('SP.M18.2024.FE.ZS', bar);
    bar = { indicator: 'Demand for family planning satisfied by modern methods (% of married women with demand for family planning)', header: 'People', value: false, type: 'Gender' };
    this.IndicatorKVP.set('SH.FPL.SATM.ZS', bar);
    bar = { indicator: 'Ratio of female to male labor force participation rate (%) (modeled ILO estimate)', header: 'People', value: false, type: 'Gender' };
    this.IndicatorKVP.set('SL.TLF.CACT.FM.ZS', bar);
    bar = { indicator: 'Female share of employment in senior and middle management (%)', header: 'People', value: false, type: 'Gender' };
    this.IndicatorKVP.set('SL.EMP.SMGT.FE.ZS', bar);
    bar = { indicator: 'Proportion of women subjected to physical and/or sexual violence in the last 12 months (% of women age 15-49)', header: 'People', value: false, type: 'Gender' };
    this.IndicatorKVP.set('SG.VAW.1549.ZS', bar);
    bar = { indicator: 'Proportion of seats held by women in national parliaments (%)', header: 'People', value: false, type: 'Gender' };
    this.IndicatorKVP.set('SG.GEN.PARL.ZS', bar);

    // //#region Poverty and Inequality
    //Poverty rates at national poverty lines
    bar = { indicator: 'Poverty headcount ratio at national poverty lines (% of population)', header: 'Poverty and Inequality', value: false, type: 'Poverty rates at national poverty lines' };
    this.IndicatorKVP.set('SI.POV.NAHC', bar);
    bar = { indicator: 'Urban poverty headcount ratio at national poverty lines (% of urban population)', header: 'Poverty and Inequality', value: false, type: 'Poverty rates at national poverty lines' };
    this.IndicatorKVP.set('SI.POV.URHC', bar);
    bar = { indicator: 'Rural poverty headcount ratio at national poverty lines (% of rural population)', header: 'Poverty and Inequality', value: false, type: 'Poverty rates at national poverty lines' };
    this.IndicatorKVP.set('SI.POV.RUHC', bar);
    bar = { indicator: 'Poverty gap at national poverty lines (%)', header: 'Poverty and Inequality', value: false, type: 'Poverty rates at national poverty lines' };
    this.IndicatorKVP.set('SI.POV.NAGP', bar);
    bar = { indicator: 'Urban poverty gap at national poverty lines (%)', header: 'Poverty and Inequality', value: false, type: 'Poverty rates at national poverty lines' };
    this.IndicatorKVP.set('SI.POV.URGP', bar);
    bar = { indicator: 'Rural poverty gap at national poverty lines (%)', header: 'Poverty and Inequality', value: false, type: 'Poverty rates at national poverty lines' };
    this.IndicatorKVP.set('SI.POV.RUGP', bar);
    //Poverty rates at international poverty lines
    bar = { indicator: 'Poverty headcount ratio at $1.90 a day (2011 PPP) (% of population)', header: 'Poverty and Inequality', value: false, type: 'Poverty rates at international poverty lines' };
    this.IndicatorKVP.set('SI.POV.DDAY', bar);
    bar = { indicator: 'Poverty headcount ratio at $3.20 a day (2011 PPP) (% of population)', header: 'Poverty and Inequality', value: false, type: 'Poverty rates at international poverty lines' };
    this.IndicatorKVP.set('SI.POV.LMIC', bar);
    bar = { indicator: 'Poverty headcount ratio at $5.50 a day (2011 PPP) (% of population)', header: 'Poverty and Inequality', value: false, type: 'Poverty rates at international poverty lines' };
    this.IndicatorKVP.set('SI.POV.UMIC', bar);
    bar = { indicator: 'Poverty gap at $1.90 a day (2011 PPP) (%)', header: 'Poverty and Inequality', value: false, type: 'Poverty rates at international poverty lines' };
    this.IndicatorKVP.set('SI.POV.GAPS', bar);
    bar = { indicator: 'Poverty gap at $3.20 a day (2011 PPP) (%)', header: 'Poverty and Inequality', value: false, type: 'Poverty rates at international poverty lines' };
    this.IndicatorKVP.set('SI.POV.LMIC.GP', bar);
    bar = { indicator: 'Poverty gap at $5.50 a day (2011 PPP) (%)', header: 'Poverty and Inequality', value: false, type: 'Poverty rates at international poverty lines' };
    this.IndicatorKVP.set('SI.POV.UMIC.GP', bar);
    //Distribution of income or consumption
    bar = { indicator: 'GINI index (World Bank estimate)', header: 'Poverty and Inequality', value: false, type: 'Distribution of income or consumption' };
    this.IndicatorKVP.set('SI.POV.GINI', bar);
    bar = { indicator: 'Income share held by lowest 10%', header: 'Poverty and Inequality', value: false, type: 'Distribution of income or consumption' };
    this.IndicatorKVP.set('SI.DST.FRST.10', bar);
    bar = { indicator: 'Income share held by lowest 20%', header: 'Poverty and Inequality', value: false, type: 'Distribution of income or consumption' };
    this.IndicatorKVP.set('SI.DST.FRST.20', bar);
    bar = { indicator: 'Income share held by second 20%', header: 'Poverty and Inequality', value: false, type: 'Distribution of income or consumption' };
    this.IndicatorKVP.set('SI.DST.02ND.20', bar);
    bar = { indicator: 'Income share held by third 20%', header: 'Poverty and Inequality', value: false, type: 'Distribution of income or consumption' };
    this.IndicatorKVP.set('SI.DST.03RD.20', bar);
    bar = { indicator: 'Income share held by fourth 20%', header: 'Poverty and Inequality', value: false, type: 'Distribution of income or consumption' };
    this.IndicatorKVP.set('SI.DST.04TH.20', bar);
    bar = { indicator: 'Income share held by highest 20%', header: 'Poverty and Inequality', value: false, type: 'Distribution of income or consumption' };
    this.IndicatorKVP.set('SI.DST.05TH.20', bar);
    bar = { indicator: 'Income share held by highest 10%', header: 'Poverty and Inequality', value: false, type: 'Distribution of income or consumption' };
    this.IndicatorKVP.set('SI.DST.10TH.10', bar);
    //Shared prosperity
    bar = { indicator: 'Annualized average growth rate in per capita real survey mean consumption or income, bottom 40% of population (%)', header: 'Poverty and Inequality', value: false, type: 'Shared prosperity' };
    this.IndicatorKVP.set('SI.SPR.PC40.ZG', bar);
    bar = { indicator: 'Annualized average growth rate in per capita real survey mean consumption or income, total population (%)', header: 'Poverty and Inequality', value: false, type: 'Shared prosperity' };
    this.IndicatorKVP.set('SI.SPR.PCAP.ZG', bar);
    bar = { indicator: 'Survey mean consumption or income per capita, bottom 40% of population (2011 PPP $ per day)', header: 'Poverty and Inequality', value: false, type: 'Shared prosperity' };
    this.IndicatorKVP.set('SI.SPR.PC40', bar);
    bar = { indicator: 'Survey mean consumption or income per capita, total population (2011 PPP $ per day)', header: 'Poverty and Inequality', value: false, type: 'Shared prosperity' };
    this.IndicatorKVP.set('SI.SPR.PCAP', bar);

    this.IndicatorKVP.forEach((value: IndicatorKeyValue, key: string) => {
      if (!(this.IndicatorArr.filter(h => h === value).length > 0)) {
        this.IndicatorArr.push(value);
      }
      if (!(this.headers.filter(h => h === value.header).length > 0)) {
        this.headers.push(value.header);
      }
      if (!(this.HeaderTypes.map(t => t.type).filter(h => h === value.type).length > 0)) {
        var foo: HeaderType = { Header: value.header, type: value.type };
        this.HeaderTypes.push(foo);
      }
    });
  }
}

