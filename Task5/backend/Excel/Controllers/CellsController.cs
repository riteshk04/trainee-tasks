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
        public async Task<IActionResult> PutCell(long id, ExcelApi.Models.Cell cell)
        {
            if (id != cell.Id)
            {
                return BadRequest("ID mismatch");
            }

            var existingCell = await _context.Cells.FindAsync(id);
            // if (existingCell == null)
            // {
            //     return NotFound("Cell not found");
            // }

            if (cell.Id == -1 || existingCell == null)
            {
                // Handle the case where a new cell should be added
                cell.Id = 0; // Assuming 0 will be overwritten by the auto-increment field
                _context.Cells.Add(cell);
            }
            else
            {
                // Update the existing cell
                _context.Entry(existingCell).CurrentValues.SetValues(cell);
            }

            try
            {
                await _context.SaveChangesAsync();
                return Ok(cell);
            }
            catch (DbUpdateException ex)
            {
                // Handle the exception, log the error, etc.
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while saving the cell");
            }
        }

        // POST: api/files
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        // [HttpPost]
        // public ActionResult<ExcelApi.Models.Cell> PostCell(ExcelApi.Models.Cell cell)
        // {
        //     if (cell.Id == -1)
        //     {
        //         cell.Id = _context.Cells.Max(x => x.Id) + 1;
        //         _context.Cells.Add(cell);
        //         _context.SaveChanges();
        //         return cell;
        //     }
        //     _context.Cells.Add(cell);
        //     _context.SaveChanges();
        //     return cell;
        // }

        // DELETE: api/files/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCell(long id)
        {
            var cell = await _context.Cells.FindAsync(id);
            if (cell == null)
            {
                return NotFound();
            }

            _context.Cells.Remove(cell);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool CellExists(long id)
        {
            return _context.Cells.Any(e => e.Id == id);
        }
    }
}
