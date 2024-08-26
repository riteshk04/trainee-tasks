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
                stopwatch.Start();
                insertFileIntoDB(file);
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

void insertFileIntoDB(File file)
{
    StringBuilder queryBuilder = new();
    queryBuilder.Append("INSERT INTO cells (`row`, col, data, file) VALUES ");
    int lastRowCount = file.StartRow - 1;
    int progress = file.Progress;
    int j = -1;
    foreach (var row in file.Data.Split('\n'))
    {
        ++lastRowCount;
        foreach (var col in row.Split(','))
        {
            ++j;
            queryBuilder.Append("(" + lastRowCount + ", " + j + ", '" + secureData(col) + "', " + file.Id + "),");
        }
        j = -1;
    }
    string query = queryBuilder.ToString().Remove(queryBuilder.Length - 1);

    insertAsync(query, file.Id, progress);
}

async Task insertAsync(string query, int fileId, int progress)
{
    using var sconnection = new MySqlConnection(_connectionString);
    await sconnection.OpenAsync();
    using var ecommand = new MySqlCommand(query, sconnection);
    await ecommand.ExecuteNonQueryAsync();
    sconnection.Close();
    // await updateProgressAsync(fileId, progress);
}

async Task updateProgressAsync(int fileId, int progress)
{
    try
    {
        using var sconnection = new MySqlConnection(_connectionString);
        await sconnection.OpenAsync();
        using var ecommand2 = new MySqlCommand($"UPDATE files SET progress = (progress + {progress}) WHERE id = {fileId}", sconnection);
        await ecommand2.ExecuteNonQueryAsync();
        sconnection.Close();
    }
    catch (Exception ex)
    {
        Console.WriteLine(ex.Message);
    }
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

    consumer.Received += (model, ea) =>
    {
        var body = ea.Body.ToArray();
        var message = Encoding.UTF8.GetString(body);
        RequestHandler(message);
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