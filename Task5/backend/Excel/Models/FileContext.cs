using Microsoft.EntityFrameworkCore;

namespace ExcelApi.Models
{
    public class FilesContext(DbContextOptions<FilesContext> options) : DbContext(options)
    {
        public DbSet<File> Files { get; set; } = null!;
    }
}