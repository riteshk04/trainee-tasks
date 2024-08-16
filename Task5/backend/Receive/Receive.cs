using System;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Text.Json.Serialization;
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
    dynamic request = JsonConvert.DeserializeObject(message);
    dynamic data = request["Data"];
    dynamic type = request["Type"];

    if (type == "POST")
    {
        Console.WriteLine("POSt request");
        dynamic name = data["Data"]["Name"];
        Console.WriteLine(name);
        dynamic extension = data["Extension"];
        int size = data["Size"];
        insertIntoDB(name, extension, size);

    }
    if (type == "PUT")
    {
        // Console.WriteLine("PUT request");
        // string name = data["Name"];
        // string extension = data["Extension"];
        // int size = data["Size"];

        // insertIntoDB(name, extension, size);
    }
    if (type == "DELETE")
    {
        // Console.WriteLine("DELETE request");
        // string name = data["Name"];
        // string extension = data["Extension"];
        // int size = data["Size"];

        // insertIntoDB(name, extension, size);
    }

}

async Task insertIntoDB(dynamic name, dynamic extension, int size)
{

    try
    {
        Console.WriteLine("query...");
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

void Dispose()
{
    _channel?.Close();
    _rabbitConnection?.Close();
    _mysqlConnection?.Close();
}

// class Request
// {
//     // [JsonPropertyName("type")]
//     public string Type { get; set; } = string.Empty;

//     public File Data { get; set; } = new();
// }

// class File
// {
//     public long Id { get; set; }

// public string Name { get; set; }

// public string Data { get; set; }

// public string Extension { get; set; }

// public int Progress { get; set; }

// public long Size { get; set; }
// }