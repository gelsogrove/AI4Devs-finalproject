import { v4 as uuidv4 } from 'uuid';
import { CreateCategoryDto, UpdateCategoryDto } from '../domain/dto/category.dto';
import { Category } from '../domain/entities/Category';
import { CategoryFilters, CategoryRepository, PaginationOptions } from '../domain/repositories/CategoryRepository';
import { CategoryId } from '../domain/valueObjects/CategoryId';
import { CategoryName } from '../domain/valueObjects/CategoryName';
import { PrismaCategoryRepository } from '../infrastructure/repositories/PrismaCategoryRepository';
import { prisma } from '../lib/prisma';

class CategoryService {
  private categoryRepository: CategoryRepository;

  constructor() {
    this.categoryRepository = new PrismaCategoryRepository(prisma);
  }

  async createCategory(dto: CreateCategoryDto): Promise<Category> {
    // Check if category name already exists
    const existingCategory = await this.categoryRepository.findByName(dto.name);
    if (existingCategory) {
      throw new Error('Category name already exists');
    }

    // Validate parent category if provided
    if (dto.parentId) {
      const parentCategory = await this.categoryRepository.findById(new CategoryId(dto.parentId));
      if (!parentCategory) {
        throw new Error('Parent category not found');
      }
      if (!parentCategory.isActive) {
        throw new Error('Parent category is not active');
      }
    }

    // Create new category
    const category = new Category(
      new CategoryId(uuidv4()),
      new CategoryName(dto.name),
      dto.description || null,
      dto.parentId ? new CategoryId(dto.parentId) : null,
      dto.isActive !== undefined ? dto.isActive : true,
      new Date(),
      new Date()
    );

    return await this.categoryRepository.save(category);
  }

  async getCategories(
    filters?: CategoryFilters,
    pagination?: PaginationOptions
  ) {
    return await this.categoryRepository.findAll(filters, pagination);
  }

  async getCategoryById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(new CategoryId(id));
    if (!category) {
      throw new Error('Category not found');
    }
    return category;
  }

  async getCategoryHierarchy(): Promise<Category[]> {
    return await this.categoryRepository.findHierarchy();
  }

  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepository.findById(new CategoryId(id));
    if (!category) {
      throw new Error('Category not found');
    }

    // Check if new name already exists (if name is being updated)
    if (dto.name && dto.name !== category.name.value) {
      const existingCategory = await this.categoryRepository.findByName(dto.name);
      if (existingCategory) {
        throw new Error('Category name already exists');
      }
    }

    // Validate parent category if provided
    if (dto.parentId !== undefined) {
      if (dto.parentId) {
        const parentCategory = await this.categoryRepository.findById(new CategoryId(dto.parentId));
        if (!parentCategory) {
          throw new Error('Parent category not found');
        }
        if (!parentCategory.isActive) {
          throw new Error('Parent category is not active');
        }
        // Prevent circular reference
        if (dto.parentId === id) {
          throw new Error('Category cannot be its own parent');
        }
      }
    }

    // Update category properties
    if (dto.name) {
      category.updateName(new CategoryName(dto.name));
    }
    if (dto.description !== undefined) {
      category.updateDescription(dto.description);
    }
    if (dto.parentId !== undefined) {
      category.updateParent(dto.parentId ? new CategoryId(dto.parentId) : null);
    }
    if (dto.isActive !== undefined) {
      if (dto.isActive) {
        category.activate();
      } else {
        category.deactivate();
      }
    }

    return await this.categoryRepository.update(category);
  }

  async deleteCategory(id: string): Promise<{ message: string }> {
    const category = await this.categoryRepository.findById(new CategoryId(id));
    if (!category) {
      throw new Error('Category not found');
    }

    // Check if category has products
    const hasProducts = await this.categoryRepository.hasProducts(new CategoryId(id));
    if (hasProducts) {
      throw new Error('Cannot delete category that has products assigned to it');
    }

    // Check if category has child categories
    const allCategories = await this.categoryRepository.findAll({ parentId: id });
    if (allCategories.data.length > 0) {
      throw new Error('Cannot delete category that has child categories');
    }

    await this.categoryRepository.delete(new CategoryId(id));
    return { message: 'Category deleted successfully' };
  }

  async getCategoryWithProductCount(id: string): Promise<{ category: Category; productCount: number }> {
    const category = await this.getCategoryById(id);
    const productCount = await this.categoryRepository.countProducts(new CategoryId(id));
    
    return { category, productCount };
  }
}

export default new CategoryService(); 