import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  RegisterBusinessDto,
  RefreshTokenDto,
} from './dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/auth.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Public — creates a new CUSTOMER account. Business owners must use
   * /auth/business/register instead.
   */
  @Public()
  @Post('register')
  async registerCustomer(@Body() dto: RegisterDto) {
    const result = await this.authService.registerCustomer(dto);
    return {
      success: true,
      message: 'Welcome! Your account is ready.',
      data: result,
    };
  }

  /**
   * POST /auth/business/register
   * Public — creates a business owner + tenant + subscription in one call.
   * Plan must be free | standard | ai (full_service uses a separate flow).
   */
  @Public()
  @Post('business/register')
  async registerBusiness(@Body() dto: RegisterBusinessDto) {
    const result = await this.authService.registerBusiness(dto);
    return {
      success: true,
      message: 'Your business account has been created.',
      data: result,
    };
  }

  /**
   * POST /auth/login
   * Public — unified login for both customer and business owner.
   */
  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.authService.login(user);
    return { success: true, message: 'Login successful', data: result };
  }

  /** POST /auth/refresh — rotate token pair. */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    const result = await this.authService.refreshTokens(dto.refreshToken);
    return { success: true, message: 'Tokens refreshed', data: result };
  }

  /** POST /auth/logout — revoke refresh token. */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.logout(user.userId);
    return { success: true, message: 'Logged out successfully' };
  }

  /** GET /auth/me — current user's profile + onboarding state. */
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.authService.getProfile(user.userId);
    return { success: true, data: profile };
  }
}
