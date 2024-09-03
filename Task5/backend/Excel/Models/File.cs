namespace ExcelApi.Models
{
    public class File
    {
        public long Id { get; set; }
        public required string Name { get; set; }
        public required string Extension { get; set; }
        public int ChuncksCount { get; set; }
        public long Size { get; set; }
        public DateTime? Uploaded { get; set; }
        public DateTime? Modified { get; set; }

    }

    public class NewFile : File
    {
        public required string Data { get; set; }
        public int StartRow { get; set; } = 0;
    }
}