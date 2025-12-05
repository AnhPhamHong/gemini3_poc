using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AgentCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkflowPaginationIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Workflows_CreatedAt",
                table: "Workflows",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Workflows_State",
                table: "Workflows",
                column: "State");

            migrationBuilder.CreateIndex(
                name: "IX_Workflows_State_CreatedAt",
                table: "Workflows",
                columns: new[] { "State", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Workflows_UpdatedAt",
                table: "Workflows",
                column: "UpdatedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Workflows_CreatedAt",
                table: "Workflows");

            migrationBuilder.DropIndex(
                name: "IX_Workflows_State",
                table: "Workflows");

            migrationBuilder.DropIndex(
                name: "IX_Workflows_State_CreatedAt",
                table: "Workflows");

            migrationBuilder.DropIndex(
                name: "IX_Workflows_UpdatedAt",
                table: "Workflows");
        }
    }
}
