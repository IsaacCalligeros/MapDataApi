using System.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;
using AutoMapper;
using System;
using Quandl.NET;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System.Net;
using MapDataApi.Dtos;
using MapDataApi.Dtos.AgriculturalLand;

namespace MapDataApi.Controllers
{
    [Route("api/[controller]")]
    //[ApiController]
    public class MapController : ControllerBase
    {
        private readonly IMapper _mapper;
        const string QuandlKey = "MxLhQeS7LefSxz9EZnb9";

        public MapController(IMapper mapper)
        {
            _mapper = mapper;

        }


        [AllowAnonymous]
        [HttpGet("GetQuandl")]
        public async Task GetQuandlData()
        {
            //Quandl.NET - Decent API for stock price data, supposedly has more indicators etc but cant find much/ seems to be refactored.
            //https://github.com/lppkarl/Quandl.NET

            Console.WriteLine("Hello");
            var client = new QuandlClient(QuandlKey);

            // The call
            var data = await client.Timeseries.GetDataAsync("WIKI", "FB");


            // Output: "Date; Open; High; Low; Close; Volume; Ex-Dividend; Split Ratio; Adj. Open; Adj. High; Adj. Low; Adj. Close; Adj. Volume"
            Console.WriteLine(string.Join("; ", data.DatasetData.ColumnNames));

            // Output: "2017-05-26; 152.23; 152.25; 151.15; 152.13; 14907827; 0; 1; 152.23; 152.25; 151.15; 152.13; 14907827"
            Console.WriteLine(string.Join("; ", data.DatasetData.Data));
        }

        [AllowAnonymous]
        [HttpGet("GetWorldBank/{countryCode}")]
        public IActionResult GetWorldBank(string countryCode)
        {
            //https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-apidocumentation  

            var webClient = new WebClient();
            webClient.Headers.Add(HttpRequestHeader.Accept, "application/json");
            var url = "http://api.worldbank.org/v2/country/" + countryCode + "?format=json";
            var json = webClient.DownloadString(url);
            var countryDataDto = CountryDataDto.FromJson(json);
            //var countryData = JsonConvert.DeserializeObject<CountryDataDto>(json);
            return Ok(countryDataDto);
            //return countryData;
        }

        //http://datatopics.worldbank.org/world-development-indicators/themes/environment.html
        [AllowAnonymous]
        [HttpGet("GetCountryAgricultural/{countryCode}/{indicator}")]
        public IActionResult GetCountryAgricultural(string countryCode, string indicator)
        {
            //https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-apidocumentation  
            //https://api.worldbank.org/v2/countries/all/indicators/AG.LND.CREL.HA
            var webClient = new WebClient();
            webClient.Headers.Add(HttpRequestHeader.Accept, "application/json");
            var url = "https://api.worldbank.org/v2/countries/" + countryCode + "/indicators/" + indicator + "?format=json";
            var json = webClient.DownloadString(url);
            var AgriculturalLandDto = AgriculturalLand.FromJson(json);
            return Ok(AgriculturalLandDto);
            //return countryData;
        }

    }
}