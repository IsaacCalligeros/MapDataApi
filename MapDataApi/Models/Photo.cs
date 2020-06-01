using System;

namespace MapDataApi.Models
{
    public class Photo
    {
        public Photo() { }
        public int Id {get; set;}
        public string Url {get; set;}
        public string Description {get; set;}
        public DateTime DateAdded {get; set;}
        public bool IsMain {get; set;}
        public User user {get; set;}
        public int UserId {get; set; }
        public string PublicId {get; set;}
    }
}