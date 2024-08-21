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
Stopwatch stopwatch;


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
                stopwatch.Start();
                await insertFileIntoDB(file.Id, file.Data, 0);
                stopwatch.Stop();
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

async Task insertFileIntoDB(int id, string csv, int lastRowCount)
{
    StringBuilder queryBuilder = new();
    queryBuilder.Append("INSERT INTO cells (`row`, col, data, file) VALUES ");

    int j = 0;
    foreach (var row in csv.Split('\n'))
    {
        ++lastRowCount;
        foreach (var col in row.Split(','))
        {
            ++j;
            queryBuilder.Append("(" + lastRowCount + ", " + j + ", '" + secureData(col) + "', " + id + "),");
        }
    }
    string query = queryBuilder.ToString().Remove(queryBuilder.Length - 1);
    await insertAsync(query);
}

async Task insertAsync(string query)
{
    using var sconnection = new MySqlConnection(_connectionString);
    await sconnection.OpenAsync();
    using var ecommand = new MySqlCommand(query, sconnection);
    await ecommand.ExecuteNonQueryAsync();
    sconnection.Close();
}

string secureData(string data)
{
    return MySqlHelper.EscapeString(data);
}

void listen()
{
    stopwatch = new Stopwatch();
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

void main()
{
    var factory = new ConnectionFactory { HostName = _hostname };
    _rabbitConnection = factory.CreateConnection();

    _channel = _rabbitConnection.CreateModel();
    _channel.QueueDeclare(queue: _queueName,
                         durable: false,
                         exclusive: false,
                         autoDelete: false,
                         arguments: null);

    listen();
}

main();