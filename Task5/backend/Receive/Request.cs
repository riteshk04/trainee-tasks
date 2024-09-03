public class Request
{
    public string Type { get; set; } = string.Empty;
    public string ObjectType { get; set; } = string.Empty;
    public string Data { get; set; } = "";
    public int Order { get; set; }
}

public class File
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Extension { get; set; }
    public string? Data { get; set; }
    public int Progress { get; set; }
    public int Size { get; set; }
    public int StartRow { get; set; } = 1;
}


public class Cell
{
    public long Id { get; set; }
    public int Row { get; set; }
    public int Col { get; set; }
    public int FontSize { get; set; }
    public int File { get; set; }
    public required string Data { get; set; }
    public required string Align { get; set; }
    public required string Font { get; set; }
    public bool Bold { get; set; }
    public bool Italic { get; set; }
    public bool Underline { get; set; }

}

public class FileMongooo{

    public long Id { get; set; }

    public int Progress { get; set; }
}