using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using ExcelApi.Models;

namespace Excel.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CellsController(Context context) : ControllerBase
    {
        private readonly Context _context = context;
        private readonly RabbitMQService rmqService = new();

        // GET: api/cells/file/5
        [HttpGet("file/{id}")]
        public async Task<ActionResult<IEnumerable<ExcelApi.Models.Cell>>> GetCells(long id)
        {
            return await _context.Cells.Where(x => x.File == id).ToListAsync();
        }

        // GET: api/cells/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ExcelApi.Models.Cell>> GetCell(long id)
        {
            var cell = await _context.Cells.FindAsync(id);

            if (cell == null)
            {
                return NotFound();
            }

            return cell;
        }

        // PUT: api/files/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public IActionResult PutCell(long id, ExcelApi.Models.Cell cell)
        {
            if (id != cell.Id)
            {
                return BadRequest();
            }
            if (!CellExists(id))
            {
                return NotFound();
            }

            rmqService.SendMessage(ProducerRequest("PUT", JsonConvert.SerializeObject(new { id = id.ToString() })));

            return Ok(JsonConvert.SerializeObject(cell));
        }

        // POST: api/files
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public ActionResult<ExcelApi.Models.Cell> CreateCell(ExcelApi.Models.Cell file)
        {
            rmqService.SendMessage(ProducerRequest("POST", JsonConvert.SerializeObject(file)));

            return Created(nameof(file), new { success = true });
        }

        // DELETE: api/files/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCell(long id)
        {
            var cell = await _context.Cells.FindAsync(id);
            if (cell == null)
            {
                return NotFound();
            }

            rmqService.SendMessage(ProducerRequest("DELETE", JsonConvert.SerializeObject(new { id = id.ToString() })));

            return NoContent();
        }

        private bool CellExists(long id)
        {
            return _context.Cells.Any(e => e.Id == id);
        }

        private string ProducerRequest(string requestType, string Data)
        {
            var payload = new
            {
                Type = requestType,
                ObjectType = "CELL",
                Data
            };
            return JsonConvert.SerializeObject(payload);
        }
    }
}
