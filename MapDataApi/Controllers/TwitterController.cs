using System;
using System.Linq;
using LinqToTwitter;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;
using MapDataApi.Dtos.Twitter;
using System.Collections.Generic;



namespace MapDataApi.Controllers
{
    [Route("api/[controller]")]
    public class TwitterController : ControllerBase
    {
        const string TwitterApiKey = "";

        [AllowAnonymous]
        [HttpGet("GetTweets/{SearchTerm}")]

        public async Task<IActionResult> GetTweets(string SearchTerm)
        {

            var auth = new ApplicationOnlyAuthorizer()
            {
                CredentialStore = new InMemoryCredentialStore
                {
                    ConsumerKey = "",
                    ConsumerSecret = "",
                },
            };
            await auth.AuthorizeAsync();

            var ctx = new TwitterContext(auth);

            var searchResponse =
                await
                (from search in ctx.Search
                 where search.Type == SearchType.Search &&
                       search.Query == SearchTerm
                 select search)
                .SingleOrDefaultAsync();


            if (searchResponse != null && searchResponse.Statuses != null)
            {
                var tweets = (from tweet in searchResponse.Statuses
                select new TweetDto()
                 {
                     UserName = tweet.User.ScreenNameResponse,
                     Tweet = tweet.Text,
                     Followers = tweet.User.FollowersCount,
                     Likes = tweet.FavoriteCount.Value,
                     Retweets = tweet.RetweetCount
                 })
                .ToList();
                return Ok(tweets);
            }

            return BadRequest();
        }



    }
}
