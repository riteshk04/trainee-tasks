namespace ExcelApi.Models
{
    public class NewCell
    {

        public int Row { get; set; }
        public int Col { get; set; }
        public int File { get; set; }
        public required string Data { get; set; }
    }
    public class Cell : NewCell
    {
        public long Id { get; set; }

        // public int FontSize { get; set; }
        // public required string Align { get; set; }
        // public required string Font { get; set; }
        // public bool Bold { get; set; }
        // public bool Italic { get; set; }
        // public bool Underline { get; set; }

    }
}