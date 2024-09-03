using MongoDB.Driver;
using MongoDB.Bson;

public class MongoDBService
{
    private readonly IMongoDatabase _database;
    public readonly IMongoCollection<BsonDocument> collection;
    public MongoDBService(string connectionString)
    {
        var client = new MongoClient(connectionString);
        _database = client.GetDatabase("excel");
        var tables = _database.ListCollectionNames().ToList();
        if (!tables.Contains("logs"))
        {
            _database.CreateCollection("logs");
        }
        collection = _database.GetCollection<BsonDocument>("logs");
    }

}