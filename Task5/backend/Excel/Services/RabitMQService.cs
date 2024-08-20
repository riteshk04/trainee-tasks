using System;
using System.Text;
using RabbitMQ.Client;
using RabbitMQ.Client.Exceptions;

public class RabbitMQService : IDisposable
{
    private IModel _channel;
    private IConnection _connection;
    private readonly ConnectionFactory _factory;

    private string _queueName = "excel_broker";

    public RabbitMQService()
    {
        _factory = new ConnectionFactory { HostName = "localhost" };
        Connect();
    }

    private void Connect()
    {
        try
        {
            _connection = _factory.CreateConnection();
            _channel = _connection.CreateModel();

            _channel.QueueDeclare(queue: _queueName,
                                 durable: false,
                                 exclusive: false,
                                 autoDelete: false,
                                 arguments: null);

            Console.WriteLine(" [*] Service started!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($" [!] Error connecting to RabbitMQ: {ex.Message}");
            // Optionally, you could implement a retry mechanism here.
        }
    }

    public void SendMessage(string message)
    {
        try
        {
            if (_channel == null || !_channel.IsOpen)
            {
                Console.WriteLine(" [!] Channel is not open. Reconnecting...");
                Connect(); // Reconnect if the channel is not open
            }

            var body = Encoding.UTF8.GetBytes(message);

            _channel.BasicPublish(exchange: string.Empty,
                                  routingKey: _queueName,
                                  basicProperties: null,
                                  body: body);
        }
        catch (AlreadyClosedException ex)
        {
            Console.WriteLine($" [!] Connection or channel was closed: {ex.Message}");
            // Reconnect or handle the situation accordingly
            Connect();
        }
        catch (Exception ex)
        {
            Console.WriteLine($" [!] Error sending message: {ex.Message}");
        }
    }

    public void Dispose()
    {
        _channel?.Close();
        _connection?.Close();
        _channel?.Dispose();
        _connection?.Dispose();
    }
}
