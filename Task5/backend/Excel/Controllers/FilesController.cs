using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using ExcelApi.Models;
using System.Diagnostics;

namespace Excel.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FilesController(Context context) : ControllerBase
    {
        private readonly Context _context = context;
        private readonly RabbitMQService rmqService = new();

        // GET: api/files
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ExcelApi.Models.File>>> GetFiles()
        {
            return await _context.Files.ToListAsync();
        }

        // GET: api/files/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ExcelApi.Models.File>> GetFile(long id)
        {
            var todoItem = await _context.Files.FindAsync(id);

            if (todoItem == null)
            {
                return NotFound();
            }

            return todoItem;
        }

        // PUT: api/files/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutFile(long id, ExcelApi.Models.File file)
        {
            if (id != file.Id)
            {
                return BadRequest();
            }
            if (!FileExists(id))
            {
                return NotFound();
            }

            _context.Entry(file).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return Ok(JsonConvert.SerializeObject(file));
        }

        // POST: api/files
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public ActionResult<ExcelApi.Models.File> FileUpload(ExcelApi.Models.NewFile file)
        {
            string csv = file.Data.Trim();

            NewFile? newFile;
            var stopwatch = new Stopwatch();
            stopwatch.Start();

            Console.WriteLine("File uploading...");

            int chunkSize = 10000;
            var chunks = csv.Split("\n")
                .Select((item, index) => new { Item = item, Index = index })
                .GroupBy(x => x.Index / chunkSize)
                .Select(g => g.Select(x => x.Item).ToList())
                .ToList();

            foreach (var chunk in chunks)
            {
                Console.WriteLine(chunk.Count);

                newFile = file;
                newFile.Data = string.Join("\n", chunk);
                rmqService.SendMessage(ProducerRequest("POST", JsonConvert.SerializeObject(file)));
                Console.WriteLine($"Time taken: {stopwatch.ElapsedMilliseconds}ms");
            }

            stopwatch.Stop();

            return Created(nameof(file), new { success = true });
        }

        // DELETE: api/files/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFile(long id)
        {
            var file = await _context.Files.FindAsync(id);
            if (file == null)
            {
                return NotFound();
            }

            _context.Files.Remove(file);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool FileExists(long id)
        {
            return _context.Files.Any(e => e.Id == id);
        }

        private static string ProducerRequest(string requestType, string Data)
        {
            var payload = new
            {
                Type = requestType,
                ObjectType = "FILE",
                Data
            };
            return JsonConvert.SerializeObject(payload);
        }
    }
}
