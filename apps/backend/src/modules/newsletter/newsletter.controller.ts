import { Controller, Post, Body, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { SubscribeDto } from './dtos/subscribe.dto';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  async subscribe(@Body() subscribeDto: SubscribeDto) {
    try {
      const result = await this.newsletterService.subscribe(subscribeDto);
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
