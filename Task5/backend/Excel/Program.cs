using Microsoft.EntityFrameworkCore;
using ExcelApi.Models;
using MySqlConnector;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddTransient(x =>
  new MySqlConnection(builder.Configuration.GetConnectionString("Default")));
builder.Services.AddControllers();
builder.Services.AddDbContext<FilesContext>(opt =>
    opt.UseMySQL("server=localhost;user=root;password=root;database=excel"));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();