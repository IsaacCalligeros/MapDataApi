using System;
using NewsAPI;
using NewsAPI.Models;
using NewsAPI.Constants;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace MapDataApi.Controllers
{
    [Route("api/[controller]")]
    public class NewsController : ControllerBase
    {
         const string NewsApiKey = "cf907af8f49946a3821aa7e14233b034";

        [AllowAnonymous]
        [HttpGet("GetNewsApi/{SearchTerm}")]
        public IActionResult GetNewsApi(string SearchTerm)
        {
            var newsApiClient = new NewsApiClient(NewsApiKey);
            var articlesResponse = newsApiClient.GetEverything(new EverythingRequest
            {
                Q = SearchTerm,
                SortBy = SortBys.Popularity,
                Language = Languages.EN,
                From = new DateTime(2019, 10, 5)
            });
            if (articlesResponse.Status == Statuses.Ok)
            {
                // total results found
                Console.WriteLine(articlesResponse.TotalResults);
                // here's the first 20
                foreach (var article in articlesResponse.Articles)
                {
                    // title
                    Console.WriteLine(article.Title);
                    // author
                    Console.WriteLine(article.Author);
                    // description
                    Console.WriteLine(article.Description);
                    // url
                    Console.WriteLine(article.Url);
                    // image
                    Console.WriteLine(article.UrlToImage);
                    // published at
                    Console.WriteLine(article.PublishedAt);
                }
            }
            return Ok(articlesResponse);
        }

    }
}