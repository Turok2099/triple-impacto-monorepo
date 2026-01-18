import { Injectable } from '@nestjs/common';
import { CreateExampleDto } from './dto/create-example.dto';
import { ExampleDto } from './dto/example.dto';

@Injectable()
export class ExampleService {
  private examples: ExampleDto[] = [];

  findAll() {
    return {
      data: this.examples,
      count: this.examples.length,
    };
  }

  findOne(id: string): ExampleDto {
    const example = this.examples.find((item) => item.id === id);
    if (!example) {
      throw new Error('Example not found');
    }
    return example;
  }

  create(createExampleDto: CreateExampleDto): ExampleDto {
    const newExample: ExampleDto = {
      id: Date.now().toString(),
      ...createExampleDto,
      createdAt: new Date(),
    };
    this.examples.push(newExample);
    return newExample;
  }
}
