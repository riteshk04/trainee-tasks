using System.Text;
using Newtonsoft.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Diagnostics;
using MySqlConnector;
using MongoDB.Driver;
using MongoDB.Bson;

string _hostname = "localhost";
string _queueName = "excel_broker";
string _connectionString = "server=localhost;user=root;password=root;database=excel";
string _mongoConnectionString = "mongodb://127.0.0.1:27017";

IModel _channel;
IConnection _rabbitConnection;
Stopwatch stopwatch;
IMongoCollection<BsonDocument> collection;

void RequestHandler(string message)
{
    try
    {
        Request? request = JsonConvert.DeserializeObject<Request>(message);
        if (request == null) return;
        string type = request.Type;
        string objectType = request.ObjectType;
        int order = request.Order;

        if (objectType == "FILE")
        {
            File? file = JsonConvert.DeserializeObject<File>(request.Data);
            if (type == "POST")
            {
                stopwatch.Start();
                insertFileIntoDB(file, order);
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

void insertFileIntoDB(File file, int order)
{
    StringBuilder queryBuilder = new();
    queryBuilder.Append("INSERT INTO cells (`row`, col, data, file) VALUES ");
    int lastRowCount = file.StartRow - 1;
    int progress = file.Progress;
    int j = -1;
    if (file.Data != null)
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

    try
    {
        _ = insertAsync(query, file, order, lastRowCount);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error: {ex.Message}");
    }
}

async Task insertAsync(string query, File file, int order, int lastRowCount)
{
    using var sconnection = new MySqlConnection(_connectionString);
    await sconnection.OpenAsync();

    using (var transaction = sconnection.BeginTransaction())
    {
        try
        {
            using (var ecommand = new MySqlCommand(query, sconnection, transaction))
            {
                ecommand.CommandTimeout = 600;
                ecommand.ExecuteNonQuery();
            }

            transaction.Commit();
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            Console.WriteLine($"Error during bulk insert: {ex.Message}");
        }
    }
    Console.WriteLine("Here");
    _ = insertLogMessage(file, order);
    sconnection.Close();
}

async Task insertLogMessage(File file, int order)
{
    try
    {
        var document = new BsonDocument
    {
        { "order", order },
        { "file", file.Id },
    };
        await collection.InsertOneAsync(document);
        Console.WriteLine("Inserted into DB" + order);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error: {ex.Message}");
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
    var _client = new MongoClient(_mongoConnectionString);
    var db = _client.GetDatabase("excel");

    var tables = db.ListCollectionNames().ToList();
    if (!tables.Contains("logs"))
    {
        db.CreateCollection("logs");
    }
    collection = db.GetCollection<BsonDocument>("logs");

    // // clear the collection
    // collection.DeleteMany(new BsonDocument());

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