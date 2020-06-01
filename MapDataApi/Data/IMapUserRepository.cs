using System.Collections.Generic;
using System.Threading.Tasks;
using MapDataApi.Models;

namespace MapDataApi.Data
{
    public interface IMapUserRepository
    {
         void Add<T>(T entity) where T: class;
         void Delete<T>(T entity) where T: class;
         Task<bool> SaveAll();
         Task<IEnumerable<User>> GetUsers();
         Task<User> GetUser(int id);

         Task<Photo> GetPhoto(int id);

         Task<Photo> GetMainUserPhoto(int userId);
    }
}