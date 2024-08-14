namespace ExcelApi.Models
{
    public class File
    {
        public long Id { get; set; }
        public required string Name { get; set; }
        public required string Extension { get; set; }
        public required string Data { get; set; }
        public int Progress { get; set; }
        public long Size { get; set; }

    }
}