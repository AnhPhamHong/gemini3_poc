using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AgentCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEditedDraftFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EditChanges",
                table: "Workflows",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EditedDraft",
                table: "Workflows",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OriginalDraft",
                table: "Workflows",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EditChanges",
                table: "Workflows");

            migrationBuilder.DropColumn(
                name: "EditedDraft",
                table: "Workflows");

            migrationBuilder.DropColumn(
                name: "OriginalDraft",
                table: "Workflows");
        }
    }
}
