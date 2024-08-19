using System.Text;
using Newtonsoft.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using MySqlConnector;


string _hostname = "localhost";
string _queueName = "excel_broker";
string _connectionString = "server=localhost;user=root;password=root;database=excel";

IModel _channel;
IConnection _rabbitConnection;

// Initialize RabbitMQ connection
var factory = new ConnectionFactory { HostName = _hostname };
_rabbitConnection = factory.CreateConnection();
_channel = _rabbitConnection.CreateModel();

// Declare RabbitMQ queue
_channel.QueueDeclare(queue: _queueName,
                     durable: false,
                     exclusive: false,
                     autoDelete: false,
                     arguments: null);

// Start listening for messages
listen();

void listen()
{
    Console.WriteLine(" [*] Waiting for messages.");

    var consumer = new EventingBasicConsumer(_channel);
    consumer.Received += (model, ea) =>
    {
        var body = ea.Body.ToArray();
        var message = Encoding.UTF8.GetString(body);
        RequestHandler(message);

        // Console.WriteLine($" [x] Received {message}");
    };

    _channel.BasicConsume(queue: _queueName,
                         autoAck: true,
                         consumer: consumer);

    Console.WriteLine(" Press [enter] to exit.");
    Console.ReadLine();
}

void RequestHandler(string message)
{
    try
    {
        Request request = JsonConvert.DeserializeObject<Request>(message);
        string type = request.Type;
        string objectType = request.ObjectType;


        if (objectType == "FILE")
        {
            File file = JsonConvert.DeserializeObject<File>(request.Data);
            if (type == "POST")
            {
                insertFileIntoDB(file.Name, file.Extension, (int)file.Size, file.Data).Wait();
            }
            if (type == "PUT")
            {
                // 
            }

        }
        else if (objectType == "CELL")
        {
            Cell cell = JsonConvert.DeserializeObject<Cell>(request.Data);

            if (type == "POST")
            {

            }
            if (type == "PUT")
            {

            }
        }
    }
    catch (JsonException jsonEx)
    {
        Console.WriteLine($"JSON Error: {jsonEx.Message}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error: {ex.Message}");
    }
}

async Task<int> fileExists(string name)
{
    using var connection = new MySqlConnection(_connectionString);
    await connection.OpenAsync();

    using var command = new MySqlCommand("SELECT * FROM files WHERE name = @name", connection);
    command.Parameters.AddWithValue("@name", name);
    using var reader = await command.ExecuteReaderAsync();

    int fileId = -1;

    if (reader.HasRows)
    {
        while (reader.Read())
        {
            fileId = reader.GetInt32(0);
        }
    }

    connection.Close();

    return fileId;
}

string secureData(string data)
{
    return MySqlHelper.EscapeString(data);
}

async Task insertFileIntoDB(string name, string extension, int size, string csv)
{
    int fileId = await fileExists(name);

    if (fileId.Equals(-1))
    {
        try
        {
            using var connection = new MySqlConnection(_connectionString);
            await connection.OpenAsync();
            Console.WriteLine("Inserting into DB...");
            using var icommand = new MySqlCommand("INSERT INTO files (name, size, extension) VALUES (@name, @size, @extension)", connection);
            icommand.Parameters.AddWithValue("@name", name);
            icommand.Parameters.AddWithValue("@size", size);
            icommand.Parameters.AddWithValue("@extension", extension);
            await icommand.ExecuteNonQueryAsync();

            fileId = (int)icommand.LastInsertedId;

            Console.WriteLine("Insertion successful");

            connection.Close();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }

    string query = "INSERT INTO cells (`row`, col, data, file) VALUES ";
    int i = 0, j = 0;
    foreach (var row in csv.Split('\n'))
    {
        ++i;
        foreach (var col in row.Split(','))
        {
            ++j;
            query += "(" + i + ", " + j + ", '" + secureData(col) + "', " + fileId + "),";
        }
    }
    query = query.Remove(query.Length - 1);


    using var sconnection = new MySqlConnection(_connectionString);
    await sconnection.OpenAsync();
    using var ecommand = new MySqlCommand(query, sconnection);
    await ecommand.ExecuteNonQueryAsync();
    sconnection.Close();
}


class Request
{
    public string Type { get; set; } = string.Empty;
    public string ObjectType { get; set; } = string.Empty;
    public string Data { get; set; } = "";
}

class File
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Extension { get; set; }
    public string? Data { get; set; }
    public int Progress { get; set; }
    public int Size { get; set; }
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