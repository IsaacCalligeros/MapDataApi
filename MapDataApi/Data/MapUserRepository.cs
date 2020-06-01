using System.Collections.Generic;
using System.Threading.Tasks;
using MapDataApi.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq;


namespace MapDataApi.Data
{
    public class MapUserRepository : IMapUserRepository
    {
        private readonly DataContext _context;
        public MapUserRepository(DataContext context)
        {
            _context = context;
        }
         public void Add<T>(T entity) where T: class
         {
             _context.Add(entity);
         }
         public void Delete<T>(T entity) where T: class
         {
             _context.Remove(entity);
         }
         public async Task<bool> SaveAll()
         {
             return await _context.SaveChangesAsync() > 0;
         }
         public async Task<IEnumerable<User>> GetUsers()
         {
             var users = await _context.Users.Include(p => p.Photos).ToListAsync();
             return users;
         }
         public async Task<User> GetUser(int id)
         {
            var user = await _context.Users.Include(p => p.Photos).FirstOrDefaultAsync(u => u.Id == id);
            return user;
         }

         public async Task<Photo> GetPhoto(int id)
         {
             var photo = await _context.Photos.FirstOrDefaultAsync(p => p.Id == id);
             return photo;
         }

         public async Task<Photo> GetMainUserPhoto(int userId)
         {
             return await _context.Photos.Where(u => u.UserId == userId).FirstOrDefaultAsync(p => p.IsMain);
         }
    }
}