using Microsoft.EntityFrameworkCore;

namespace ExcelApi.Models
{
    public class Context(DbContextOptions<Context> options) : DbContext(options)
    {
        public DbSet<File> Files { get; set; } = null!;

        public DbSet<Cell> Cells { get; set; } = null!;
    }
}