import { Price } from '../valueObjects/Price';
import { ProductId } from '../valueObjects/ProductId';
import { ProductName } from '../valueObjects/ProductName';

export class Product {
  private readonly _id: ProductId;
  private _name: ProductName;
  private _description: string;
  private _price: Price;
  private _imageUrl: string;
  private _category: string;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: ProductId,
    name: ProductName,
    description: string,
    price: Price,
    imageUrl: string,
    category: string,
    createdAt: Date,
    updatedAt: Date
  ) {
    this._id = id;
    this._name = name;
    this._description = description;
    this._price = price;
    this._imageUrl = imageUrl;
    this._category = category;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // Getters
  get id(): ProductId {
    return this._id;
  }

  get name(): ProductName {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get price(): Price {
    return this._price;
  }

  get imageUrl(): string {
    return this._imageUrl;
  }

  get category(): string {
    return this._category;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business methods
  updateName(name: ProductName): void {
    this._name = name;
    this._updatedAt = new Date();
  }

  updateDescription(description: string): void {
    this._description = description;
    this._updatedAt = new Date();
  }

  updatePrice(price: Price): void {
    this._price = price;
    this._updatedAt = new Date();
  }

  updateImageUrl(imageUrl: string): void {
    this._imageUrl = imageUrl;
    this._updatedAt = new Date();
  }

  updateCategory(category: string): void {
    this._category = category;
    this._updatedAt = new Date();
  }

  // Serialization method for DTO conversion
  toDTO() {
    return {
      id: this._id.value,
      name: this._name.value,
      description: this._description,
      price: this._price.amount,
      imageUrl: this._imageUrl,
      category: this._category,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }
  
  // Factory method for creating from DTO
  static fromDTO(dto: any): Product {
    return new Product(
      new ProductId(dto.id),
      new ProductName(dto.name),
      dto.description,
      new Price(dto.price),
      dto.imageUrl,
      dto.category,
      dto.createdAt instanceof Date ? dto.createdAt : new Date(dto.createdAt),
      dto.updatedAt instanceof Date ? dto.updatedAt : new Date(dto.updatedAt)
    );
  }
} 