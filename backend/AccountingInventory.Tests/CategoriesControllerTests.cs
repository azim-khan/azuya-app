using AccountingInventory.API.Controllers;
using AccountingInventory.Core.DTOs;
using AccountingInventory.Core.Entities;
using AccountingInventory.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace AccountingInventory.Tests
{
    public class CategoriesControllerTests
    {
        private readonly Mock<IGenericRepository<Category>> _mockRepo;
        private readonly CategoriesController _controller;

        public CategoriesControllerTests()
        {
            _mockRepo = new Mock<IGenericRepository<Category>>();
            _controller = new CategoriesController(_mockRepo.Object);
        }

        [Fact]
        public async Task GetCategories_ReturnsOkResult_WithListOfCategories()
        {
            // Arrange
            var categories = new List<Category>
            {
                new Category { Id = 1, Name = "Electronics" },
                new Category { Id = 2, Name = "Groceries" }
            };
            _mockRepo.Setup(repo => repo.GetAllAsync()).ReturnsAsync(categories);

            // Act
            var result = await _controller.GetCategories();

            // Assert
            var actionResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnCategories = Assert.IsAssignableFrom<IReadOnlyList<Category>>(actionResult.Value);
            Assert.Equal(2, returnCategories.Count);
        }

        [Fact]
        public async Task GetCategory_ReturnsNotFound_WhenCategoryDoesNotExist()
        {
            // Arrange
            _mockRepo.Setup(repo => repo.GetByIdAsync(1)).ReturnsAsync((Category)null);

            // Act
            var result = await _controller.GetCategory(1);

            // Assert
            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task CreateCategory_ReturnsCreatedAtAction()
        {
            // Arrange
            var dto = new CreateCategoryDto { Name = "New Category" };
            var category = new Category { Id = 1, Name = "New Category" };
            
            _mockRepo.Setup(repo => repo.AddAsync(It.IsAny<Category>()))
                .Callback<Category>(c => c.Id = 1) // Simulate ID generation
                .ReturnsAsync(category);

            // Act
            var result = await _controller.CreateCategory(dto);

            // Assert
            var createdAtActionResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            Assert.Equal("GetCategory", createdAtActionResult.ActionName);
            Assert.Equal(1, createdAtActionResult.RouteValues["id"]);
        }
    }
}
