using System;
using System.Text;
using System.Threading.Tasks;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using MySqlConnector;

 class Receive
{
    private readonly string _hostname = "localhost";
    private readonly string _queueName = "excel_broker";

    private IModel _channel;
    private IConnection _rabbitConnection;
    private MySqlConnection _mysqlConnection;

    public Receive()
    {
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
    }

    private void listen()
    {
        Console.WriteLine(" [*] Waiting for messages.");

        var consumer = new EventingBasicConsumer(_channel);
        consumer.Received += async (model, ea) =>
        {
            var body = ea.Body.ToArray();
            var message = Encoding.UTF8.GetString(body);
            Console.WriteLine($" [x] Received {message}");

            // Process the message (e.g., save it to MySQL)
            await processMessageAsync(message);
        };

        _channel.BasicConsume(queue: _queueName,
                             autoAck: true,
                             consumer: consumer);

        Console.WriteLine(" Press [enter] to exit.");
        Console.ReadLine();
    }

    private async Task processMessageAsync(string message)
    {
        // Example method to process the received message
        // Implement your logic here
        try
        {
            using var command = new MySqlCommand("INSERT INTO your_table (message) VALUES (@message)", _mysqlConnection);
            command.Parameters.AddWithValue("@message", message);
            await command.ExecuteNonQueryAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }

    public void Dispose()
    {
        _channel?.Close();
        _rabbitConnection?.Close();
        _mysqlConnection?.Close();
    }
    public class Main{
        Receive r = new();
        
    }
}
