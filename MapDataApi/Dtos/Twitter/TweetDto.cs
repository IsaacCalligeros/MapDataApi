namespace MapDataApi.Dtos.Twitter
{
    public class TweetDto
    {
        public TweetDto() {}
        public TweetDto(string userName, string tweet)
        {
            UserName = userName;
            Tweet = tweet;
        }
        public TweetDto(string userName, string tweet, int followers, int likes, int retweets)
        {
            UserName = userName;
            Tweet = tweet;
            Followers = followers;
            Likes = likes;
            Retweets = retweets;
        }
        public string UserName {get; set;}
        public string Tweet {get; set;}
        public int Followers {get; set;}
        public int Likes {get; set;}
        public int Retweets {get; set;}
    }
}