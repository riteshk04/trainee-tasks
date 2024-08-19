using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using ExcelApi.Models;

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
        public IActionResult PutFile(long id, ExcelApi.Models.File file)
        {
            if (id != file.Id)
            {
                return BadRequest();
            }
            if (!FileExists(id))
            {
                return NotFound();
            }

            rmqService.SendMessage(ProducerRequest("PUT", JsonConvert.SerializeObject(new { id = id.ToString() })));

            return Ok(JsonConvert.SerializeObject(file));
        }

        // POST: api/files
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public ActionResult<ExcelApi.Models.File> FileUpload(ExcelApi.Models.NewFile file)
        {
            rmqService.SendMessage(ProducerRequest("POST", JsonConvert.SerializeObject(file)));

            return Created(nameof(file), new { success = true });
        }

        // DELETE: api/files/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFile(long id)
        {
            var todoItem = await _context.Files.FindAsync(id);
            if (todoItem == null)
            {
                return NotFound();
            }

            rmqService.SendMessage(ProducerRequest("DELETE", JsonConvert.SerializeObject(new { id = id.ToString() })));

            return NoContent();
        }

        private bool FileExists(long id)
        {
            return _context.Files.Any(e => e.Id == id);
        }

        private string ProducerRequest(string requestType, string Data)
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
