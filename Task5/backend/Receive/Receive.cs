using System.Text;
using Newtonsoft.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Diagnostics;
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
var stopwatch = new Stopwatch();
listen();

void listen()
{
    Console.WriteLine(" [*] Waiting for messages.");

    var consumer = new EventingBasicConsumer(_channel);
    consumer.Received += async (model, ea) =>
    {
        var body = ea.Body.ToArray();
        var message = Encoding.UTF8.GetString(body);
        await RequestHandlerAsync(message);
    };

    _channel.BasicConsume(queue: _queueName,
                         autoAck: true,
                         consumer: consumer);

    Console.WriteLine(" Press [enter] to exit.");
    Console.ReadLine();
}

async Task RequestHandlerAsync(string message)
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
                stopwatch.Restart();
                await insertFileIntoDB(file.Name, file.Extension, file.Size, file.Data);
                // stopwatch.Stop();
                Console.WriteLine($"Time taken: {stopwatch.Elapsed}s");
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

async Task<int> getLastInsertedRow(int fileId)
{
    using var connection = new MySqlConnection(_connectionString);
    await connection.OpenAsync();
    using var command = new MySqlCommand("SELECT MAX(`row`) FROM cells WHERE file = @fileId", connection);
    command.Parameters.AddWithValue("@fileId", fileId);
    using var reader = await command.ExecuteReaderAsync();
    reader.Read();
    if (!reader.HasRows)
        return reader.GetInt32(0);

    return 0;
}

async Task insertFileIntoDB(string name, string extension, int size, string csv)
{
    int fileId = await fileExists(name);
    int lastRowCount = 0;

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

    // lastRowCount = await getLastInsertedRow(fileId);

    StringBuilder queryBuilder = new StringBuilder();
    queryBuilder.Append("INSERT INTO cells (`row`, col, data, file) VALUES ");

    int j = 0;
    foreach (var row in csv.Split('\n'))
    {
        ++lastRowCount;
        foreach (var col in row.Split(','))
        {
            ++j;
            queryBuilder.Append("(" + lastRowCount + ", " + j + ", '" + secureData(col) + "', " + fileId + "),");
        }
    }
    Console.WriteLine(j);
    string query = queryBuilder.ToString().Remove(queryBuilder.Length - 1);
    insertAsync(query);
}


async Task insertAsync(string query)
{

    using var sconnection = new MySqlConnection(_connectionString);
    await sconnection.OpenAsync();
    using var ecommand = new MySqlCommand(query, sconnection);
    await ecommand.ExecuteNonQueryAsync();
    sconnection.Close();
}


async Task insertCellIntoDB(int row, int col, string data, int fileId)
{
    using var connection = new MySqlConnection(_connectionString);
    await connection.OpenAsync();
    using var command = new MySqlCommand("INSERT INTO cells (`row`, col, data, file) VALUES (@row, @col, @data, @file)", connection);
    command.Parameters.AddWithValue("@row", row);
    command.Parameters.AddWithValue("@col", col);
    command.Parameters.AddWithValue("@data", data);
    command.Parameters.AddWithValue("@file", fileId);
    await command.ExecuteNonQueryAsync();
    connection.Close();
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