using System;
using System.Text;
using Newtonsoft.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using MySqlConnector;

string _hostname = "localhost";
string _queueName = "excel_broker";

IModel _channel;
IConnection _rabbitConnection;
MySqlConnection _mysqlConnection;

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

// Initialize MySQL connection
_mysqlConnection = new MySqlConnection("server=localhost;user=root;password=root;database=excel");
_mysqlConnection.Open();

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
        Console.WriteLine($" [x] Received {message}");

        RequestHandler(message);
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
        File file = JsonConvert.DeserializeObject<File>(request.Data);
        string type = request.Type;

        if (type == "POST")
        {
            insertFileIntoDB(file.Name, file.Extension, (int)file.Size).Wait();
        }
        if (type == "PUT")
        {
            insertFileIntoDB(file.Name, file.Extension, (int)file.Size).Wait();
        }
        if (type == "DELETE")
        {
            // Handle DELETE operation if needed
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

async Task insertFileIntoDB(string name, string extension, int size)
{
    try
    {
        Console.WriteLine("Inserting into DB...");
        using var command = new MySqlCommand("INSERT INTO excel_files (name, size, extension) VALUES (@name, @size, @extension)", _mysqlConnection);
        command.Parameters.AddWithValue("@name", name);
        command.Parameters.AddWithValue("@size", size);
        command.Parameters.AddWithValue("@extension", extension);
        await command.ExecuteNonQueryAsync();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error: {ex.Message}");
    }
}


class Request
{
    public string Type { get; set; } = string.Empty;
    public string Data { get; set; } = "";
}

class File
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Extension { get; set; }
    public int Progress { get; set; }
    public int Size { get; set; }
}
